import os
import requests
from app.config import settings
from app.services.ingest import FAISS_DATA_PATH, google_ef
from langchain_community.vectorstores import FAISS

def ask_question(document_id: int, query: str, chat_history: list = None):
    try:
        # Retrieve context from FAISS using custom embedding function
        if not os.path.exists(os.path.join(FAISS_DATA_PATH, "index.faiss")):
            return {
                "answer": "No documents have been indexed yet.",
                "citation": None,
                "is_grounded": False
            }
            
        db = FAISS.load_local(FAISS_DATA_PATH, google_ef, allow_dangerous_deserialization=True)
        results = db.similarity_search(query, k=4, filter={"document_id": document_id})
        
        if not results:
            return {
                "answer": "I could not find any relevant information in the document to answer your question.",
                "citation": None,
                "is_grounded": False
            }
            
        # Combine the retrieved chunks into a context string
        context_str = "\n\n---\n\n".join([doc.page_content for doc in results])
        metadata_chunks = [doc.metadata for doc in results]

        
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
        
        # Call Gemini REST API
        api_key = settings.GOOGLE_API_KEY
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        resp = requests.post(url, json=payload)
        if resp.status_code != 200:
            print(f"Gemini API Error: {resp.status_code} - {resp.text}")
            return {
                "answer": "Sorry, I am currently unable to process your question due to an AI service error. Please try again later.",
                "citation": None,
                "is_grounded": False
            }
            
        data = resp.json()
        answer = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        # Simple grounding check
        is_grounded = True
        if "I cannot find the answer" in answer or "cannot find" in answer.lower() or "not contained" in answer.lower():
            is_grounded = False
            
        # Format advanced citation
        citation = None
        if is_grounded and metadata_chunks:
            # metadata typically contains 'page' if parsed by PyPDFLoader
            page = metadata_chunks[0].get("page", 0) + 1 # 1-indexed
            
            chunk_id = "unknown"
                
            citation = {
                "page": page,
                "section": "Main Document",
                "chunk_id": chunk_id,
                "confidence": "High"
            }
            
        return {
            "answer": answer,
            "citation": citation,
            "is_grounded": is_grounded
        }
    except Exception as e:
        print(f"Error in ask_question: {str(e)}")
        return {
            "answer": "An unexpected server error occurred while processing your question.",
            "citation": None,
            "is_grounded": False
        }
