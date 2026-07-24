import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, FileText, CheckCircle, AlertTriangle, Copy, RefreshCw, User, FileUp, ThumbsUp, ThumbsDown, Download, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useToast } from './ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import PdfViewer from './PdfViewer';

const ChatPanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState(location.state?.documentId ? [location.state.documentId] : []);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const messagesEndRef = useRef(null);
  const pdfRef = useRef(null);
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
      setDocuments(res.data.items || res.data); // Support both old and new format during transition
      if (res.data.items && res.data.items.length > 0 && selectedDocs.length === 0) {
        setSelectedDocs([res.data.items[0].id]);
      } else if (res.data.length > 0 && selectedDocs.length === 0) {
        setSelectedDocs([res.data[0].id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (queryText = input) => {
    if (!queryText.trim() || selectedDocs.length === 0) return;

    const userMsg = { id: Date.now(), role: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyToPass = messages.map(m => ({ role: m.role, text: m.text }));
      
      const assistantMsgId = Date.now() + 1;
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        text: '',
        citations: [],
        isGrounded: true,
        originalQuery: queryText,
        feedback: 0
      }]);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/query/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ document_ids: selectedDocs, query: userMsg.text, chat_history: historyToPass })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'token') {
              setMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? { ...m, text: m.text + data.text } : m
              ));
            } else if (data.type === 'complete') {
              setMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? { 
                  ...m, 
                  text: data.full_answer,
                  citations: data.citations,
                  retrievalAnalytics: data.retrieval_analytics,
                  isGrounded: data.is_grounded,
                  logId: data.log_id
                } : m
              ));
            } else if (data.type === 'error') {
               setMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? { 
                  ...m, 
                  text: m.text + "\n\n[Error: " + data.message + "]",
                  isError: true
                } : m
              ));
            }
          } catch (e) {
            console.error("Error parsing stream chunk", e);
          }
        }
      }
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

  const handleFeedback = async (msgId, logId, feedbackValue) => {
    if (!logId) return;
    
    // Optimistic update
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: feedbackValue } : m));
    
    try {
      await api.post(`/api/query/${logId}/feedback`, { feedback: feedbackValue });
      showToast("Feedback recorded", "success");
    } catch (err) {
      console.error(err);
      // Revert on error
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: 0 } : m));
      showToast("Failed to record feedback", "error");
    }
  };

  const exportChat = () => {
    if (messages.length === 0) {
      showToast("No messages to export", "error");
      return;
    }
    
    let mdContent = `# Chat Export - ManifestIQ\nDate: ${new Date().toLocaleString()}\n\n`;
    
    messages.forEach(msg => {
      const roleName = msg.role === 'user' ? 'User' : 'ManifestIQ Assistant';
      mdContent += `## ${roleName}\n${msg.text}\n\n`;
      if (msg.citations && msg.citations.length > 0) {
        mdContent += `*Sources:*\n`;
        msg.citations.forEach(cit => {
          mdContent += `- Page ${cit.page}, Section: ${cit.section} (Match: ${cit.confidence})\n`;
        });
        mdContent += `\n`;
      }
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Chat exported successfully", "success");
  };

  return (
    <div className="chat-container" style={{ display: 'flex', height: 'calc(100vh - 4rem)', gap: '1.5rem' }}>
      
      {/* Document Selection Sidebar */}
      <div className="chat-sidebar card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', backgroundColor: 'var(--white)' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Selected Documents ({selectedDocs.length})</h3>
        {documents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
            {documents.map(doc => (
              <div 
                key={doc.id}
                onClick={() => {
                  setSelectedDocs(prev => 
                    prev.includes(doc.id) 
                      ? prev.filter(id => id !== doc.id)
                      : [...prev, doc.id]
                  );
                }}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: selectedDocs.includes(doc.id) ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: selectedDocs.includes(doc.id) ? 'rgba(29, 158, 117, 0.05)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
              >
                <FileText size={18} color={selectedDocs.includes(doc.id) ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: selectedDocs.includes(doc.id) ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedDocs.includes(doc.id) ? 'var(--primary-dark)' : 'var(--text-main)' }}>
                    {doc.filename}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {doc.id} {doc.status === 'Indexed' ? '• Ready' : `• ${doc.status}`}</span>
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
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', backgroundColor: 'var(--bg-light)', position: 'relative' }}>
        
        {/* Header Actions */}
        <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
          {selectedDocs.length === 1 && (
            <button 
              onClick={() => setShowPdf(!showPdf)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: '6px',
                backgroundColor: showPdf ? 'var(--primary)' : 'var(--white)', 
                border: '1px solid var(--border)',
                color: showPdf ? 'white' : 'var(--text-main)', 
                fontSize: '0.875rem', cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              {showPdf ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              {showPdf ? 'Hide PDF' : 'Show PDF'}
            </button>
          )}
          
          {messages.length > 0 && (
            <button 
              onClick={exportChat}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: '6px',
                backgroundColor: 'var(--white)', border: '1px solid var(--border)',
                color: 'var(--text-main)', fontSize: '0.875rem', cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <Download size={16} /> Export Chat
            </button>
          )}
        </div>
        
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
                        
                        {msg.citations && msg.citations.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <FileText size={16} color="var(--primary)" /> Sources ({msg.citations.length})
                            </div>
                            {msg.citations.map((cit, idx) => (
                              <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--white)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{cit.section}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Page {cit.page} • Chunk {cit.chunk_id} • Relevance Score: {cit.confidence}</span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      if (selectedDocs.length === 1 || cit.document_id === selectedDocs[0]) {
                                        setShowPdf(true);
                                        // Small timeout to allow the PdfViewer to render if it was hidden
                                        setTimeout(() => {
                                          if (pdfRef.current) pdfRef.current.goToPage(cit.page);
                                        }, 100);
                                      } else {
                                        // Open in new tab if it's a multi-doc chat and the citation is from a different doc
                                        window.open(`http://localhost:8000/api/documents/${cit.document_id}/pdf?token=${localStorage.getItem('token')}#page=${cit.page}`, '_blank');
                                      }
                                    }}
                                    className="btn-outline" 
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                                  >
                                    View Source
                                  </button>
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.4' }}>
                                  "{cit.snippet}"
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        

                      </div>
                    )}

                    {/* Actions */}
                    {msg.role === 'assistant' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => copyToClipboard(msg.text)} title="Copy response" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                            <Copy size={18} />
                          </button>
                          <button onClick={() => regenerateResponse(msg.originalQuery)} title="Regenerate response" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                            <RefreshCw size={18} />
                          </button>
                        </div>
                        {msg.logId && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleFeedback(msg.id, msg.logId, msg.feedback === 1 ? 0 : 1)} 
                              title="Helpful" 
                              style={{ background: 'none', border: 'none', color: msg.feedback === 1 ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', transition: 'color 0.2s' }}
                            >
                              <ThumbsUp size={18} fill={msg.feedback === 1 ? 'currentColor' : 'none'} />
                            </button>
                            <button 
                              onClick={() => handleFeedback(msg.id, msg.logId, msg.feedback === -1 ? 0 : -1)} 
                              title="Not helpful" 
                              style={{ background: 'none', border: 'none', color: msg.feedback === -1 ? 'var(--error)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', transition: 'color 0.2s' }}
                            >
                              <ThumbsDown size={18} fill={msg.feedback === -1 ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        )}
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

        <div style={{ padding: '2rem', backgroundColor: 'transparent' }}>
          {messages.length === 0 && selectedDocs.length === 1 && documents.find(d => d.id === selectedDocs[0])?.suggested_questions?.length > 0 && (
            <div style={{ maxWidth: '800px', margin: '0 auto 1.5rem auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {documents.find(d => d.id === selectedDocs[0]).suggested_questions.map((sq, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSend(sq)}
                  style={{
                    backgroundColor: 'var(--white)',
                    border: '1px solid var(--border)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    color: 'var(--primary-dark)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'rgba(29,158,117,0.05)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'var(--white)'; }}
                >
                  {sq}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedDocs.length > 0 ? "Ask a question about the selected document(s)... (Shift+Enter for new line)" : "Please select a document first"}
              disabled={selectedDocs.length === 0 || loading}
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
              disabled={selectedDocs.length === 0 || !input.trim() || loading}
              style={{ 
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                width: '36px', height: '36px', 
                padding: 0,
                borderRadius: '8px',
                backgroundColor: (selectedDocs.length === 0 || !input.trim() || loading) ? 'var(--bg-light)' : 'var(--primary)',
                color: (selectedDocs.length === 0 || !input.trim() || loading) ? 'var(--text-muted)' : 'white',
                border: 'none',
                cursor: (selectedDocs.length === 0 || !input.trim() || loading) ? 'not-allowed' : 'pointer',
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
      
      {/* PDF Viewer Pane */}
      <AnimatePresence>
        {showPdf && selectedDocs.length === 1 && (
          <motion.div 
            initial={{ opacity: 0, width: 0 }} 
            animate={{ opacity: 1, width: '45%' }} 
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ height: '100%', overflow: 'hidden' }}
          >
            <PdfViewer 
              ref={pdfRef} 
              fileUrl={`http://localhost:8000/api/documents/${selectedDocs[0]}/pdf`} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPanel;
