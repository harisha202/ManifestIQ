import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import Embeddings
from typing import List
import requests
from app.config import settings

FAISS_DATA_PATH = os.path.join(os.path.dirname(__file__), "../../faiss_index")
os.makedirs(FAISS_DATA_PATH, exist_ok=True)

class GoogleRESTLangchainEmbeddings(Embeddings):
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
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
            resp = requests.post(url, json=payload)
            if resp.status_code != 200:
                print(f"Embedding error: {resp.text}")
                embeddings.append([0.0] * 3072)
            else:
                data = resp.json()
                embeddings.append(data["embedding"]["values"])
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        return self.embed_documents([text])[0]

google_ef = GoogleRESTLangchainEmbeddings()

def ingest_document(file_path: str, document_id: int):
    # Load PDF
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    
    # Chunk text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_documents(documents)
    
    for chunk in chunks:
        chunk.metadata["document_id"] = document_id
        
    if not chunks:
        return 0

    if os.path.exists(os.path.join(FAISS_DATA_PATH, "index.faiss")):
        db = FAISS.load_local(FAISS_DATA_PATH, google_ef, allow_dangerous_deserialization=True)
        db.add_documents(chunks)
    else:
        db = FAISS.from_documents(chunks, google_ef)
        
    db.save_local(FAISS_DATA_PATH)
    
    return len(chunks)
