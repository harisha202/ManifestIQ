import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, File, FileText } from 'lucide-react';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/documents/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (file.type !== "application/pdf") {
      alert("Only PDF files are supported");
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/documents/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Documents</h1>
        <p>Manage your uploaded supply-chain documents here.</p>
      </div>

      <div 
        className="card" 
        style={{ 
          marginBottom: '2rem', 
          border: dragActive ? '2px dashed var(--primary)' : '2px dashed var(--border)',
          backgroundColor: dragActive ? 'rgba(29, 158, 117, 0.05)' : 'var(--white)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Upload New Document</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Drag a PDF here or click to browse</p>
        
        <input 
          type="file" 
          id="file-upload" 
          accept="application/pdf" 
          style={{ display: 'none' }} 
          onChange={handleChange}
        />
        <label htmlFor="file-upload" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
          {uploading ? 'Processing...' : 'Browse Files'}
        </label>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Your Documents</h3>
        {documents.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {documents.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '6px', transition: 'border-color 0.2s' }}>
                <FileText size={24} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 500 }}>{doc.filename}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Uploaded: {new Date(doc.upload_date).toLocaleDateString()}</p>
                </div>
                <button className="btn-outline">View Details</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-light)', borderRadius: '6px' }}>
            <File size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <p>No documents uploaded yet. Upload a PDF to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
