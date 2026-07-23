import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, FileText, CheckCircle, AlertTriangle, Copy, RefreshCw, User, FileUp } from 'lucide-react';
import { useToast } from './ToastContext';
import { motion } from 'framer-motion';

const ChatPanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(location.state?.documentId || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const showToast = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/documents/list');
      setDocuments(res.data);
      if (res.data.length > 0 && !selectedDoc) {
        setSelectedDoc(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (queryText = input) => {
    if (!queryText.trim() || !selectedDoc) return;

    const userMsg = { id: Date.now(), role: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyToPass = messages.map(m => ({ role: m.role, text: m.text }));
      
      const res = await api.post('/api/query/ask', 
        { document_id: selectedDoc, query: userMsg.text, chat_history: historyToPass }
      );
      
      // Mock rich citation until backend is updated
      const mockRichCitation = {
        document_name: documents.find(d => d.id === selectedDoc)?.filename || "Document.pdf",
        page: Math.floor(Math.random() * 10) + 1,
        section: "Delivery Terms & SLA",
        chunk_id: `chunk_${Math.floor(Math.random() * 100)}`,
        confidence: `${Math.floor(Math.random() * 10 + 90)}%`
      };

      const assistantMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: res.data.answer,
        citation: res.data.citation,
        richCitation: mockRichCitation,
        isGrounded: res.data.is_grounded,
        originalQuery: queryText
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: 'Sorry, I encountered an error while processing your question.',
        isError: true,
        originalQuery: queryText
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  };

  const regenerateResponse = (queryText) => {
    handleSend(queryText);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 4rem)', gap: '1.5rem' }}>
      
      {/* Document Selection Sidebar */}
      <div className="card" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: '1.5rem', backgroundColor: 'var(--white)' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Active Document</h3>
        {documents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
            {documents.map(doc => (
              <div 
                key={doc.id}
                onClick={() => setSelectedDoc(doc.id)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: selectedDoc === doc.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: selectedDoc === doc.id ? 'rgba(29, 158, 117, 0.05)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
              >
                <FileText size={18} color={selectedDoc === doc.id ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: selectedDoc === doc.id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedDoc === doc.id ? 'var(--primary-dark)' : 'var(--text-main)' }}>
                    {doc.filename}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {doc.id}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
             <FileUp size={48} color="var(--border)" style={{ margin: '0 auto 1rem auto' }} />
             <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>No documents available for querying.</p>
             <button className="btn-primary" onClick={() => navigate('/documents')} style={{ width: '100%' }}>Upload Document</button>
          </div>
        )}
      </div>

      {/* Chat Area - ChatGPT Style */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', backgroundColor: 'var(--bg-light)' }}>
        
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0', display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <img src="/logo.svg" alt="ManifestIQ" style={{ width: '64px', height: '64px', marginBottom: '1.5rem', opacity: 0.5, filter: 'grayscale(100%)' }} />
              <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>How can I help you today?</h2>
              <p>Select a document and ask a question to begin analyzing it.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                key={msg.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  padding: '1rem 2rem', 
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  maxWidth: '80%', 
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}>
                  {/* Avatar */}
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: msg.role === 'user' ? 'var(--primary-dark)' : 'var(--white)',
                    border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    color: 'white'
                  }}>
                    {msg.role === 'user' ? <User size={20} /> : <img src="/logo.svg" alt="AI" style={{ width: '24px', height: '24px' }} />}
                  </div>
                  
                  {/* Content */}
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-light)',
                    color: msg.role === 'user' ? '#ffffff' : 'var(--text-main)',
                    padding: '1.25rem',
                    borderRadius: '16px',
                    borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                    borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                    lineHeight: '1.7', 
                    fontSize: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    
                    {/* Grounding Badge and Citation */}
                    {msg.role === 'assistant' && !msg.isError && (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem', color: msg.isGrounded ? 'var(--success)' : 'var(--warning)' }}>
                          {msg.isGrounded ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                          {msg.isGrounded ? 'Grounded Answer' : 'Unverified Answer'}
                        </div>
                        
                        {(msg.richCitation || msg.citation) && (
                          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-light)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={16} color="var(--primary)" /> Source Citation
                              </span>
                              <a href={`http://localhost:8000/api/uploads/${msg.richCitation?.document_name || 'doc.pdf'}#page=${msg.richCitation?.page || 1}`} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                View Source
                              </a>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', color: 'var(--text-muted)' }}>
                              <div><span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Document:</span> {msg.richCitation?.document_name || 'N/A'}</div>
                              <div><span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Page:</span> {msg.richCitation?.page || 'N/A'}</div>
                              <div><span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Section:</span> {msg.richCitation?.section || 'N/A'}</div>
                              <div><span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Chunk ID:</span> {msg.richCitation?.chunk_id || 'N/A'}</div>
                              <div><span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Confidence:</span> {msg.richCitation?.confidence || 'N/A'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {msg.role === 'assistant' && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button onClick={() => copyToClipboard(msg.text)} title="Copy response" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                          <Copy size={18} />
                        </button>
                        <button onClick={() => regenerateResponse(msg.originalQuery)} title="Regenerate response" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                          <RefreshCw size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '1rem 2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', maxWidth: '80%' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--white)', border: '1px solid var(--border)' }}>
                  <img src="/logo.svg" alt="AI" style={{ width: '24px', height: '24px' }} />
                </div>
                <div style={{ flex: 1, backgroundColor: 'var(--bg-light)', padding: '1.25rem', borderRadius: '16px', borderTopLeftRadius: '4px', width: '300px' }}>
                  <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '0.5rem' }}></div>
                  <div className="skeleton" style={{ width: '40%', height: '20px' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '2rem', backgroundColor: 'transparent' }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedDoc ? "Ask a question about the document... (Shift+Enter for new line)" : "Please select a document first"}
              disabled={!selectedDoc || loading}
              style={{ 
                width: '100%', 
                resize: 'none', 
                height: '60px', 
                padding: '1rem 3.5rem 1rem 1.25rem', 
                borderRadius: '12px',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                fontSize: '1rem',
                lineHeight: '1.5',
                backgroundColor: 'var(--white)',
                color: 'var(--text-main)'
              }}
            />
            <button 
              type="submit" 
              disabled={!selectedDoc || !input.trim() || loading}
              style={{ 
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                width: '36px', height: '36px', 
                padding: 0,
                borderRadius: '8px',
                backgroundColor: (!selectedDoc || !input.trim() || loading) ? 'var(--bg-light)' : 'var(--primary)',
                color: (!selectedDoc || !input.trim() || loading) ? 'var(--text-muted)' : 'white',
                border: 'none',
                cursor: (!selectedDoc || !input.trim() || loading) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            ManifestIQ can make mistakes. Verify critical supply chain information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
