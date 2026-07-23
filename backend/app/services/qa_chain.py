import os
import google.generativeai as genai
from app.config import settings
from app.services.ingest import chroma_client

# Configure Gemini API
genai.configure(api_key=settings.GOOGLE_API_KEY)

def ask_question(document_id: int, query: str):
    try:
        # Retrieve context from ChromaDB
        collection = chroma_client.get_collection(name="manifestiq_docs")
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
        prompt = f"""
You are an expert supply chain document assistant. 
Use the following context from a document to answer the question.
If the answer is not contained in the context, say "I cannot find the answer in the provided document." Do not guess or hallucinate.

Context:
{context_str}

Question:
{query}

Answer the question clearly and concisely.
"""
        
        # Call Gemini
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        answer = response.text.strip()
        
        # Simple grounding check
        is_grounded = True
        if "I cannot find the answer" in answer or "cannot find" in answer.lower() or "not contained" in answer.lower():
            is_grounded = False
            
        # Format citation (just picking the first chunk's page for simplicity)
        citation = None
        if is_grounded and metadata_chunks:
            # metadata typically contains 'page' if parsed by PyPDFLoader
            page = metadata_chunks[0].get("page", 0) + 1 # 1-indexed
            citation = f"Found on page {page}"
            
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
