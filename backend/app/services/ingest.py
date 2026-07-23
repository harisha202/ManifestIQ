import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader
import chromadb
from chromadb.config import Settings
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
import uuid
import requests
from app.config import settings

# Initialize ChromaDB client (local persistent storage)
CHROMA_DATA_PATH = os.path.join(os.path.dirname(__file__), "../../chroma_db")
os.makedirs(CHROMA_DATA_PATH, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)

class GoogleRESTEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        api_key = settings.GOOGLE_API_KEY
        url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
        embeddings = []
        for text in input:
            payload = {
                "model": "models/text-embedding-004",
                "content": {
                    "parts": [{"text": text}]
                }
            }
            resp = requests.post(url, json=payload)
            if resp.status_code != 200:
                print(f"Embedding error: {resp.text}")
                # Fallback to zero vector if failure
                embeddings.append([0.0] * 768)
            else:
                data = resp.json()
                embeddings.append(data["embedding"]["values"])
        return embeddings

google_ef = GoogleRESTEmbeddingFunction()

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
    
    # Store in ChromaDB
    collection = chroma_client.get_or_create_collection(
        name="manifestiq_docs",
        embedding_function=google_ef
    )
    
    docs = []
    metadatas = []
    ids = []
    
    for i, chunk in enumerate(chunks):
        docs.append(chunk.page_content)
        metadata = chunk.metadata.copy()
        metadata["document_id"] = document_id
        metadatas.append(metadata)
        ids.append(f"doc_{document_id}_chunk_{i}_{uuid.uuid4().hex[:8]}")
        
    if docs:
        collection.add(
            documents=docs,
            metadatas=metadatas,
            ids=ids
        )
    
    return len(docs)
