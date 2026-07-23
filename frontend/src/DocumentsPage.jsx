import React, { useState, useEffect } from 'react';
import api from './api';
import { Upload, FileText, Search, Filter, FileUp, CheckCircle, Database, Layers, File, Server } from 'lucide-react';
import { useToast } from './ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentPreviewModal from './DocumentPreviewModal';

const PipelineStep = ({ icon, text, active, completed }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: active || completed ? 1 : 0.4 }}>
    <div style={{ 
      width: '40px', height: '40px', borderRadius: '50%', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: completed ? 'var(--success)' : active ? 'var(--primary)' : 'var(--bg-light)',
      color: completed || active ? 'white' : 'var(--text-muted)',
      transition: 'all 0.3s ease'
    }}>
      {completed ? <CheckCircle size={20} /> : icon}
    </div>
    <span style={{ fontSize: '0.75rem', fontWeight: active ? 600 : 400, color: active ? 'var(--primary)' : 'var(--text-muted)' }}>{text}</span>
  </div>
);

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState(null);
  
  // Pipeline Simulation State
  const [pipelineStep, setPipelineStep] = useState(0); 
  // 1: Uploading, 2: Extracting, 3: Chunking, 4: Embedding, 5: Saving, 6: Ready

  const showToast = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/documents/list');
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch documents", "error");
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
      showToast("Only PDF files are supported", "error");
      return;
    }
    
    setUploading(true);
    setPipelineStep(1);
    
    let currentStep = 1;
    const simInterval = setInterval(() => {
      currentStep++;
      if (currentStep <= 5) {
        setPipelineStep(currentStep);
      }
    }, 800);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post('/api/documents/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      
      clearInterval(simInterval);
      setPipelineStep(6);
      showToast("Document uploaded and indexed successfully", "success");
      fetchDocuments();
      
      setTimeout(() => {
        setUploading(false);
        setPipelineStep(0);
      }, 2000);
      
    } catch (err) {
      clearInterval(simInterval);
      setUploading(false);
      setPipelineStep(0);
      showToast(err.response?.data?.detail || "Upload failed", "error");
    }
  };

  const getStatusBadge = (status) => {
    const s = status || 'Indexed';
    let color = 'var(--text-muted)';
    let bg = 'var(--bg-light)';
    
    if (s === 'Indexed') { color = 'var(--success)'; bg = 'rgba(16, 185, 129, 0.1)'; }
    if (s === 'Processing') { color = 'var(--warning)'; bg = 'rgba(245, 158, 11, 0.1)'; }
    if (s === 'Failed') { color = 'var(--error)'; bg = 'rgba(239, 68, 68, 0.1)'; }

    return (
      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, color, backgroundColor: bg }}>
        {s}
      </span>
    );
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || (doc.status || 'Indexed') === statusFilter;
    const matchesType = typeFilter === 'All' || doc.filename.toLowerCase().endsWith('.pdf');
    
    let matchesDate = true;
    if (dateFilter !== 'All') {
      const docDate = new Date(doc.upload_date);
      const now = new Date();
      if (dateFilter === 'Today') {
        matchesDate = docDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'Past 7 Days') {
        matchesDate = (now - docDate) / (1000 * 3600 * 24) <= 7;
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem',
          position: 'relative', overflow: 'hidden', minHeight: '300px'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <AnimatePresence mode="wait">
          {!uploading ? (
            <motion.div 
              key="upload-prompt"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
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
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                Browse Files
              </label>
            </motion.div>
          ) : (
            <motion.div 
              key="upload-pipeline"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ width: '100%', maxWidth: '600px' }}
            >
              <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>Processing Document...</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {/* Connecting Line */}
                <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', height: '2px', backgroundColor: 'var(--bg-light)', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', height: '2px', backgroundColor: 'var(--primary)', zIndex: 0, width: `${(Math.min(pipelineStep, 5) - 1) * 25}%`, transition: 'width 0.5s ease' }}></div>
                
                <div style={{ zIndex: 1 }}><PipelineStep icon={<Upload size={20} />} text="Uploading" active={pipelineStep === 1} completed={pipelineStep > 1} /></div>
                <div style={{ zIndex: 1 }}><PipelineStep icon={<FileText size={20} />} text="Extracting" active={pipelineStep === 2} completed={pipelineStep > 2} /></div>
                <div style={{ zIndex: 1 }}><PipelineStep icon={<Layers size={20} />} text="Chunking" active={pipelineStep === 3} completed={pipelineStep > 3} /></div>
                <div style={{ zIndex: 1 }}><PipelineStep icon={<Database size={20} />} text="Embedding" active={pipelineStep === 4} completed={pipelineStep > 4} /></div>
                <div style={{ zIndex: 1 }}><PipelineStep icon={<Server size={20} />} text="Saving" active={pipelineStep === 5} completed={pipelineStep > 5} /></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Your Documents</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '35px', width: '200px' }}
              />
            </div>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--white)', color: 'var(--text-main)', fontFamily: 'Inter' }}
            >
              <option value="All">All Statuses</option>
              <option value="Indexed">Indexed</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
            </select>
            <select 
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--white)', color: 'var(--text-main)', fontFamily: 'Inter' }}
            >
              <option value="All">All Types</option>
              <option value="PDF">PDF Only</option>
            </select>
            <select 
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--white)', color: 'var(--text-main)', fontFamily: 'Inter' }}
            >
              <option value="All">Any Time</option>
              <option value="Today">Today</option>
              <option value="Past 7 Days">Past 7 Days</option>
            </select>
          </div>
        </div>

        {filteredDocs.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredDocs.map((doc, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                key={doc.id} 
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--white)' }}
              >
                <FileText size={24} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 500 }}>{doc.filename}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Uploaded: {new Date(doc.upload_date).toLocaleDateString()}</p>
                    {getStatusBadge(doc.status)}
                  </div>
                </div>
                <button className="btn-outline" onClick={() => setSelectedPreviewDoc(doc)}>View Details</button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-light)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <FileUp size={48} style={{ margin: '0 auto 1.5rem auto', color: 'var(--border)' }} />
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>No documents found</h3>
            <p style={{ marginBottom: '1.5rem' }}>Try adjusting your search filters or upload a new document.</p>
          </div>
        )}
      </div>

      <DocumentPreviewModal 
        isOpen={!!selectedPreviewDoc} 
        onClose={() => setSelectedPreviewDoc(null)} 
        document={selectedPreviewDoc} 
      />
    </motion.div>
  );
};

export default DocumentsPage;
