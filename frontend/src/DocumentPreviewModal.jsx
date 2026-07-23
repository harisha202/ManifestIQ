import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Calendar, Layers, Activity, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
  const navigate = useNavigate();

  if (!isOpen || !document) return null;

  const handleAskAI = () => {
    navigate('/chat', { state: { documentId: document.id } });
  };

  // Using mock data for page_count and chunk_count until backend is updated
  const pageCount = document.page_count || Math.floor(Math.random() * 20) + 1;
  const chunkCount = document.chunk_count || (pageCount * 4);
  const status = document.status || 'Indexed';

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: 'var(--white)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-light)' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--primary)" /> Document Preview
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '2rem 1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>
              {document.filename}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded On</div>
                  <div style={{ fontWeight: 500 }}>{new Date(document.upload_date).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <Activity size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                  <div style={{ fontWeight: 500, color: status === 'Indexed' ? 'var(--success)' : status === 'Failed' ? 'var(--error)' : 'var(--warning)' }}>
                    {status}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. Pages</div>
                  <div style={{ fontWeight: 500 }}>{pageCount}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vector Chunks</div>
                  <div style={{ fontWeight: 500 }}>{chunkCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: 'var(--bg-light)' }}>
            <button onClick={onClose} className="btn-outline">Close</button>
            <button onClick={handleAskAI} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} /> Ask AI
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentPreviewModal;
