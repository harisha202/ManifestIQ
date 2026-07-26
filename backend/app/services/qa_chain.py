import os
import requests
import time
import re
import hashlib
from app.config import settings
from app.services.ingest import FAISS_DATA_PATH, google_ef
from langchain_community.vectorstores import FAISS

_faiss_db = None
_bm25_retriever = None

def get_faiss_db():
    global _faiss_db
    if _faiss_db is None:
        if os.path.exists(os.path.join(FAISS_DATA_PATH, "index.faiss")):
            _faiss_db = FAISS.load_local(FAISS_DATA_PATH, google_ef, allow_dangerous_deserialization=True)
    return _faiss_db

def get_bm25_retriever():
    global _bm25_retriever
    import pickle
    if _bm25_retriever is None:
        bm25_path = os.path.join(FAISS_DATA_PATH, "bm25.pkl")
        if os.path.exists(bm25_path):
            with open(bm25_path, 'rb') as f:
                _bm25_retriever = pickle.load(f)
    return _bm25_retriever

def reload_faiss_db():
    global _faiss_db, _bm25_retriever
    if os.path.exists(os.path.join(FAISS_DATA_PATH, "index.faiss")):
        _faiss_db = FAISS.load_local(FAISS_DATA_PATH, google_ef, allow_dangerous_deserialization=True)
    import pickle
    bm25_path = os.path.join(FAISS_DATA_PATH, "bm25.pkl")
    if os.path.exists(bm25_path):
        with open(bm25_path, 'rb') as f:
            _bm25_retriever = pickle.load(f)

def guess_section(text: str) -> str:
    # Look for capitalized headers, optionally with Section X or numbering
    match = re.search(r'(?:^|\n)(?:Section\s+\d+\.?\d*|SECTION\s+\d+\.?\d*|\d+\.\d*\s*)?\s*([A-Z][A-Z\s&,-]{4,60})(?:\n|$)', text)
    if match:
        return match.group(1).strip().title()
    
    return text[:30].replace('\n', ' ') + "..."

def ask_question(document_ids: list, query: str, chat_history: list = None):
    try:
        start_time = time.time()
        
        # Retrieve context from FAISS using custom embedding function
        db = get_faiss_db()
        if not db:
            import json
            yield json.dumps({
                "type": "complete",
                "full_answer": "No documents have been indexed yet.",
                "citations": [],
                "is_grounded": False,
                "retrieval_analytics": {}
            }) + "\n"
            return
        
        # LangChain FAISS supports filtering by exact match, or we can search overall and filter post-hoc if needed.
        # But simpler for now: query across the whole index, then filter the results by our document_ids list.
        # We fetch more results (k=30) and filter down to top 8 valid ones.
        raw_results = db.similarity_search_with_score(query, k=30)
        faiss_results = []
        for doc, score in raw_results:
            if doc.metadata.get("document_id") in document_ids:
                faiss_results.append((doc, score))
                
        bm25_retriever = get_bm25_retriever()
        bm25_results = []
        if bm25_retriever:
            bm25_retriever.k = 30
            raw_bm25 = bm25_retriever.invoke(query)
            for doc in raw_bm25:
                if doc.metadata.get("document_id") in document_ids:
                    bm25_results.append(doc)

        # Reciprocal Rank Fusion (RRF)
        rrf_k = 60
        rrf_scores = {}
        for i, (doc, score) in enumerate(faiss_results):
            content_hash = doc.page_content
            if content_hash not in rrf_scores:
                rrf_scores[content_hash] = {"doc": doc, "score": 0.0, "faiss_score": score}
            rrf_scores[content_hash]["score"] += 1.0 / (rrf_k + i + 1)
            
        for i, doc in enumerate(bm25_results):
            content_hash = doc.page_content
            if content_hash not in rrf_scores:
                rrf_scores[content_hash] = {"doc": doc, "score": 0.0, "faiss_score": 1.0}
            rrf_scores[content_hash]["score"] += 1.0 / (rrf_k + i + 1)
            
        sorted_results = sorted(rrf_scores.values(), key=lambda x: x["score"], reverse=True)
        results = []
        for res in sorted_results[:8]:
            results.append((res["doc"], res["faiss_score"]))
        
        retrieval_time = time.time() - start_time
        
        if not results:
            import json
            yield json.dumps({
                "type": "complete",
                "full_answer": "I could not find any relevant information in the document to answer your question.",
                "citations": [],
                "is_grounded": False,
                "retrieval_analytics": {
                    "time_ms": int(retrieval_time * 1000),
                    "chunk_count": 0,
                    "model": "gemini-flash-latest"
                }
            }) + "\n"
            return
            
        # Combine the retrieved chunks into a context string
        context_str = "\n\n---\n\n".join([doc.page_content for doc, score in results])
        
        # Build prompt for Gemini
        history_str = ""
        if chat_history:
            for msg in chat_history:
                role = "User" if msg.get("role") == "user" else "Assistant"
                history_str += f"{role}: {msg.get('text')}\n"
                
        prompt = f"""
You are an expert supply chain document assistant. 
Use the following context from a document to answer the question.
If the answer is not contained in the context, say "I cannot find the answer in the provided document." Do not guess or hallucinate.

Context:
{context_str}

Conversation History:
{history_str}

Question:
{query}

Answer the question clearly and concisely.
"""
        
        # Call Gemini REST API with streaming
        api_key = settings.GOOGLE_API_KEY
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse&key={api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        # Calculate citations early
        citations = []
        for doc, score in results:
            conf = max(0.0, min(100.0, 100.0 - (score * 50.0)))
            page = doc.metadata.get("page", 0) + 1
            snippet = doc.page_content[:200].replace('\n', ' ') + "..."
            section = guess_section(doc.page_content)
            chunk_id = hashlib.md5(doc.page_content.encode('utf-8')).hexdigest()[:8]
            
            citations.append({
                "page": page,
                "section": section,
                "snippet": snippet,
                "chunk_id": f"chk_{chunk_id}",
                "confidence": f"{conf:.1f}%",
                "document_id": doc.metadata.get("document_id")
            })

        analytics = {
            "time_ms": int(retrieval_time * 1000),
            "chunk_count": len(results),
            "model": "gemini-3.5-flash"
        }

        # Yield metadata first
        import json
        
        with requests.post(url, json=payload, stream=True) as resp:
            if resp.status_code != 200:
                print(f"Gemini API Error: {resp.status_code} - {resp.text}")
                yield json.dumps({"type": "error", "message": "API Error"}) + "\n"
                return

            full_answer = ""
            for line in resp.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith("data: "):
                        data_str = decoded_line[6:]
                        try:
                            data = json.loads(data_str)
                            if "candidates" in data and len(data["candidates"]) > 0:
                                parts = data["candidates"][0].get("content", {}).get("parts", [])
                                if parts:
                                    text_chunk = parts[0].get("text", "")
                                    full_answer += text_chunk
                                    yield json.dumps({"type": "token", "text": text_chunk}) + "\n"
                        except json.JSONDecodeError:
                            pass
            
            # Post-process for grounding
            is_grounded = True
            if "I cannot find the answer" in full_answer or "cannot find" in full_answer.lower() or "not contained" in full_answer.lower():
                is_grounded = False

            # Yield complete event
            yield json.dumps({
                "type": "complete",
                "citations": citations if is_grounded else [],
                "is_grounded": is_grounded,
                "retrieval_analytics": analytics,
                "full_answer": full_answer
            }) + "\n"

    except Exception as e:
        import json
        print(f"Error in ask_question: {str(e)}")
        yield json.dumps({"type": "error", "message": "An unexpected server error occurred."}) + "\n"

