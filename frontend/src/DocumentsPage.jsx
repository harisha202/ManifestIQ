import React, { useState, useEffect } from 'react';
import api from './api';
import { Upload, FileText, Search, FileUp, CheckCircle, Database, Layers, Server, Trash2, ExternalLink } from 'lucide-react';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState(null);
  
  // Selection for bulk actions
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setDocuments(res.data.items || res.data);
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
    setUploadProgress(0);
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
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      clearInterval(simInterval);
      setPipelineStep(6);
      showToast("Document uploaded successfully", "success");
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
    
    if (s === 'Indexed') { color = 'var(--success)'; bg = 'rgba(34, 197, 94, 0.1)'; }
    if (s === 'Processing') { color = 'var(--warning)'; bg = 'rgba(245, 158, 11, 0.1)'; }
    if (s === 'Failed') { color = 'var(--error)'; bg = 'rgba(239, 68, 68, 0.1)'; }

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, color, backgroundColor: bg }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }}></div>
        {s}
      </span>
    );
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || (doc.status || 'Indexed') === statusFilter;
    const matchesType = typeFilter === 'All' || doc.filename.toLowerCase().endsWith('.pdf');
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDocs(filteredDocs.map(d => d.id));
    } else {
      setSelectedDocs([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedDocs([...selectedDocs, id]);
    } else {
      setSelectedDocs(selectedDocs.filter(docId => docId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedDocs.length} document(s)?`)) return;
    
    setIsDeleting(true);
    try {
      await api.post('/api/documents/delete', { document_ids: selectedDocs });
      showToast(`Successfully deleted ${selectedDocs.length} documents`, "success");
      setSelectedDocs([]);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete documents", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ padding: '2rem' }}>
      <div className="page-header section-spacing">
        <h1>Documents</h1>
        <p>Manage and index your supply-chain documents.</p>
      </div>

      <div 
        className="card section-spacing" 
        style={{ 
          border: dragActive ? '2px dashed var(--primary)' : '1px dashed var(--border)',
          backgroundColor: dragActive ? 'var(--primary-bg)' : 'var(--white)',
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
              <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Processing Document...</h3>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-light)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: 'var(--primary)', width: `${uploadProgress}%`, transition: 'width 0.2s' }}></div>
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{uploadProgress}% Uploaded</span>
              </div>
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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: 'var(--bg-light)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '35px', width: '250px', backgroundColor: 'var(--white)' }}
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {selectedDocs.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="btn-outline" 
                style={{ borderColor: 'var(--error)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--white)' }}
              >
                <Trash2 size={16} /> Delete Selected ({selectedDocs.length})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--white)', zIndex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={filteredDocs.length > 0 && selectedDocs.length === filteredDocs.length}
                    onChange={handleSelectAll}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Name</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Type</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Pages</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Chunks</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Size</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length > 0 ? (
                filteredDocs.map(doc => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s', backgroundColor: selectedDocs.includes(doc.id) ? 'var(--primary-bg)' : 'transparent' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedDocs.includes(doc.id)}
                        onChange={(e) => handleSelectOne(e, doc.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-main)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} color="var(--primary)" style={{ flexShrink: 0 }} /> {doc.filename}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>PDF</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>{doc.pages || '-'}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>{doc.chunk_count || '-'}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>{formatSize(doc.file_size_bytes)}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>{getStatusBadge(doc.status)}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => setSelectedPreviewDoc(doc)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Preview"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FileUp size={48} style={{ margin: '0 auto 1.5rem auto', color: 'var(--border)' }} />
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>No documents found</h3>
                    <p style={{ marginBottom: '1.5rem' }}>Try adjusting your search filters or upload a new document.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
