import os
import requests
from app.config import settings
from app.services.ingest import chroma_client, google_ef

def ask_question(document_id: int, query: str, chat_history: list = None):
    try:
        # Retrieve context from ChromaDB using custom embedding function
        collection = chroma_client.get_collection(
            name="manifestiq_docs",
            embedding_function=google_ef
        )
        results = collection.query(
            query_texts=[query],
            n_results=4,
            where={"document_id": document_id}
        )
        
        if not results['documents'] or not results['documents'][0]:
            return {
                "answer": "I could not find any relevant information in the document to answer your question.",
                "citation": None,
                "is_grounded": False
            }
            
        # Combine the retrieved chunks into a context string
        context_chunks = results['documents'][0]
        metadata_chunks = results['metadatas'][0]
        
        context_str = "\n\n---\n\n".join(context_chunks)
        
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
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        resp = requests.post(url, json=payload)
        if resp.status_code != 200:
            return {
                "answer": f"Error from Gemini API: {resp.text}",
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
            
            # extract chunk ID from ids (e.g. doc_1_chunk_4_1a2b3c4d)
            chunk_id = "unknown"
            if results['ids'] and results['ids'][0]:
                chunk_id = results['ids'][0][0]
                
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
            "answer": f"An error occurred while processing the question: {str(e)}",
            "citation": None,
            "is_grounded": False
        }
