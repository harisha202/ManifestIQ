# 🚀 ManifestIQ — Supply Chain Document Assistant

ManifestIQ is a specialized Python/FastAPI application designed as an intelligent document assistant for Global Supply Chain Management Systems. It enables logistics professionals to upload supply chain documents such as shipping manifests, vendor SLAs, customs documents, and Standard Operating Procedures (SOPs), then ask natural language questions using a secure Retrieval-Augmented Generation (RAG) pipeline.

---

# 🎯 Why ManifestIQ?

Modern supply chain platforms excel at tracking shipments and managing structured data. However, extracting information from unstructured documents such as contracts, customs regulations, and operating manuals is still a manual and time-consuming process.

ManifestIQ solves this challenge by integrating modern AI technologies into supply chain workflows. It demonstrates production-level implementation of Vector Search, LangChain RAG architecture, FastAPI, and Docker while ensuring grounded AI responses that minimize hallucinations.

---

# ✨ Key Features

- Advanced Retrieval-Augmented Generation (RAG) pipeline
- Upload and process PDF documents
- Semantic search using ChromaDB vector database
- AI-powered answers using Google Gemini API
- Grounded responses based only on uploaded documents
- Automatic source citations for every answer
- JWT Authentication
- Analytics dashboard for document activity and query tracking
- Responsive React-based enterprise dashboard
- Dockerized deployment with Docker Compose

---

# 📈 Real-World Use Cases

### Customs Brokers

Instantly search a large customs tariff manual to find the exact duty rate for a specific HS Code.

### Procurement Managers

Upload vendor agreements and instantly ask questions such as:

> What is the financial penalty for a delivery delayed by 48 hours?

Receive an immediate answer with document citation.

### Warehouse Staff

Quickly search Standard Operating Procedures for hazardous material handling instructions without reading hundreds of pages.

### Logistics Teams

Retrieve shipment policies, compliance requirements, packaging standards, and transportation guidelines within seconds.



---

# 📂 Project Structure

```
ManifestIQ
│
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docker-compose.yml
├── .env
└── README.md
```

---

# 🔒 Security Features

- JWT Authentication
- Protected API Endpoints
- Secure Environment Variables
- Grounded AI Responses
- Source Citations
- Retrieval-Based Answer Generation

---

# 📊 Future Improvements

- Multi-document search
- OCR support for scanned PDFs
- Voice-based document queries
- Role-based access control (RBAC)
- Document version management
- Chat history
- Redis caching
- Kubernetes deployment

---


