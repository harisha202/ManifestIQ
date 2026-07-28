import os
import json
import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import Embeddings
from typing import List
import requests
from app.config import settings
from sqlalchemy.orm import Session
from app.models.document import Document

# Setup logging
logger = logging.getLogger(__name__)

FAISS_DATA_PATH = os.path.join(os.path.dirname(__file__), "../../faiss_index")
os.makedirs(FAISS_DATA_PATH, exist_ok=True)

class GoogleRESTLangchainEmbeddings(Embeddings):
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        import time
        api_key = settings.GOOGLE_API_KEY
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key={api_key}"
        embeddings = []
        for text in texts:
            payload = {
                "model": "models/gemini-embedding-2",
                "content": {
                    "parts": [{"text": text}]
                }
            }
            last_error = None
            for attempt in range(3):
                try:
                    resp = requests.post(url, json=payload, timeout=15)
                    if resp.status_code == 200:
                        data = resp.json()
                        embeddings.append(data["embedding"]["values"])
                        last_error = None
                        break
                    else:
                        last_error = f"Status {resp.status_code}: {resp.text}"
                        time.sleep(1.5 * (attempt + 1))
                except Exception as ex:
                    last_error = str(ex)
                    time.sleep(1.5 * (attempt + 1))
            if last_error:
                logger.error(f"Embedding error after retries: {last_error}")
                raise Exception(f"Embedding API failed: {last_error}")
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        return self.embed_documents([text])[0]

google_ef = GoogleRESTLangchainEmbeddings()

def generate_suggested_questions(text_snippet: str) -> str:
    """Generate 3 dynamic suggested questions based on document content."""
    fallback_models = ["gemini-2.5-flash-lite", "gemini-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash", "gemini-2.0-flash"]
    prompt = f"""
    Based on the following supply chain document excerpt, generate 3 specific, useful questions that a user might ask about it.
    Return ONLY a valid JSON array of 3 strings. Do not include any other formatting, markdown, or text.
    
    Excerpt:
    {text_snippet}
    """
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    for model_name in fallback_models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GOOGLE_API_KEY}"
            resp = requests.post(url, json=payload, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text.startswith("```json"):
                    text = text[7:-3].strip()
                elif text.startswith("```"):
                    text = text[3:-3].strip()
                questions = json.loads(text)
                if isinstance(questions, list):
                    return json.dumps(questions[:3])
        except Exception as e:
            logger.error(f"Failed to generate suggested questions with {model_name}: {str(e)}")
    return json.dumps(["What are the key terms in this document?", "Who are the parties involved?", "What are the deadlines?"])

def generate_summary_and_keywords(text_snippet: str) -> dict:
    """Generate a summary and keywords for the document."""
    fallback_models = ["gemini-2.5-flash-lite", "gemini-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash", "gemini-2.0-flash"]
    prompt = f"""
    Based on the following supply chain document excerpt, generate:
    1. A brief summary (2-3 sentences) of the document's purpose.
    2. A list of 4-6 key entities, terms, or risk factors as keywords.
    
    Return ONLY a valid JSON object with the keys "summary" (string) and "keywords" (array of strings). Do not include any other formatting or markdown.
    
    Excerpt:
    {text_snippet}
    """
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    for model_name in fallback_models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GOOGLE_API_KEY}"
            resp = requests.post(url, json=payload, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text.startswith("```json"):
                    text = text[7:-3].strip()
                elif text.startswith("```"):
                    text = text[3:-3].strip()
                parsed = json.loads(text)
                return {
                    "summary": parsed.get("summary", "Document summary unavailable."),
                    "keywords": parsed.get("keywords", [])
                }
        except Exception as e:
            logger.error(f"Failed to generate summary and keywords with {model_name}: {str(e)}")
    return {"summary": "Document processed without summary.", "keywords": []}
def ingest_document_sync(file_path: str, document_id: int, db: Session):
    try:
        logger.info(f"Starting ingestion for document {document_id}")
        # Load PDF
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        # Check if it's a scanned PDF by looking at the total extracted text length
        total_text_len = sum(len(d.page_content.strip()) for d in documents)
        if total_text_len < 50:
            logger.info(f"Document {document_id} appears to be a scanned PDF (text length: {total_text_len}). Attempting OCR fallback.")
            try:
                import pytesseract
                from pdf2image import convert_from_path
                from langchain_core.documents import Document as LC_Document
                
                # Convert PDF pages to images
                images = convert_from_path(file_path)
                ocr_documents = []
                for i, img in enumerate(images):
                    # Extract text using Tesseract OCR
                    text = pytesseract.image_to_string(img)
                    if text.strip():
                        ocr_documents.append(LC_Document(page_content=text, metadata={"source": file_path, "page": i}))
                
                if ocr_documents:
                    documents = ocr_documents
                    logger.info(f"OCR successfully extracted {len(ocr_documents)} pages of text for document {document_id}.")
                else:
                    logger.warning(f"OCR ran but found no text for document {document_id}.")
            except ImportError:
                logger.warning("OCR libraries (pytesseract, pdf2image) not installed. Skipping OCR.")
            except Exception as ocr_e:
                logger.warning(f"OCR fallback failed (Tesseract/Poppler may not be installed on host): {str(ocr_e)}")

        # Chunk text
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_documents(documents)
        
        num_pages = len(documents)
        num_chunks = len(chunks)
        
        if not chunks:
            logger.warning(f"No chunks extracted from document {document_id}")
            return
            
        for chunk in chunks:
            chunk.metadata["document_id"] = document_id
            
        # This will raise exceptions natively if the API fails, rather than failing silently
        if os.path.exists(os.path.join(FAISS_DATA_PATH, "index.faiss")):
            faiss_db = FAISS.load_local(FAISS_DATA_PATH, google_ef, allow_dangerous_deserialization=True)
            faiss_db.add_documents(chunks)
        else:
            faiss_db = FAISS.from_documents(chunks, google_ef)
            
        faiss_db.save_local(FAISS_DATA_PATH)
        
        # Build and save BM25 retriever
        from langchain_community.retrievers import BM25Retriever
        import pickle
        all_docs = list(faiss_db.docstore._dict.values())
        if all_docs:
            bm25_retriever = BM25Retriever.from_documents(all_docs)
            bm25_path = os.path.join(FAISS_DATA_PATH, "bm25.pkl")
            with open(bm25_path, 'wb') as f:
                pickle.dump(bm25_retriever, f)
        
        # Trigger reload of FAISS DB in QA Chain if it's already in memory
        from app.services.qa_chain import reload_faiss_db
        reload_faiss_db()
        
        # Generate suggested questions from the first large chunk
        snippet = chunks[0].page_content[:2000] if chunks else ""
        suggested_questions_json = generate_suggested_questions(snippet)
        
        # Generate summary and keywords
        analysis = generate_summary_and_keywords(snippet)
        
        # Update DB document status
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "Indexed"
            doc.suggested_questions = suggested_questions_json
            doc.summary = analysis["summary"]
            doc.keywords = json.dumps(analysis["keywords"])
            doc.pages = num_pages
            doc.chunk_count = num_chunks
            db.commit()
            
        logger.info(f"Successfully ingested document {document_id} with {len(chunks)} chunks.")
    except Exception as e:
        logger.error(f"Error ingesting document {document_id}: {str(e)}", exc_info=True)
        # Update DB to error status
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "Error"
            db.commit()
        raise
