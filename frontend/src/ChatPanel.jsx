import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, FileText, CheckCircle, AlertTriangle, Copy, RefreshCw, User, FileUp, Download, ExternalLink, Clock, Database, Cpu, X, PlusCircle, Check, HelpCircle, FileCheck, Calendar } from 'lucide-react';
import { useToast } from './ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import PdfViewer from './PdfViewer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatPanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState(location.state?.documentId ? [location.state.documentId] : []);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState(null);
  const [showPdf, setShowPdf] = useState(null);
  const messagesEndRef = useRef(null);
  const pdfRef = useRef(null);
  const showToast = useToast();
  const [sessionStartTime] = useState(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, processingStage]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/documents/list');
      setDocuments(res.data.items || res.data);
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
    setProcessingStage('searching');
    
    const retrieveTimeout = setTimeout(() => {
      setProcessingStage(prev => prev === 'searching' ? 'retrieving' : prev);
    }, 800);

    try {
      const historyToPass = messages.map(m => ({ role: m.role, text: m.text }));
      
      const assistantMsgId = Date.now() + 1;
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        text: '',
        citations: [],
        retrievalAnalytics: null,
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
              setProcessingStage('generating');
              setMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? { ...m, text: m.text + data.text } : m
              ));
            } else if (data.type === 'complete') {
              setMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? { 
                  ...m, 
                  text: data.full_answer,
                  citations: (data.citations || []).sort((a, b) => b.confidence - a.confidence), // Sort by confidence desc
                  retrievalAnalytics: data.retrieval_analytics,
                  isGrounded: data.is_grounded,
                  logId: data.log_id
                } : m
              ));
              setProcessingStage(null);
              clearTimeout(retrieveTimeout);
            } else if (data.type === 'error') {
               setMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? { 
                  ...m, 
                  text: m.text + "\n\n**Error:** " + data.message,
                  isError: true
                } : m
              ));
              setProcessingStage(null);
            }
          } catch (e) {
            console.error("Error parsing stream chunk", e);
          }
        }
      }
    } catch (err) {
      clearTimeout(retrieveTimeout);
      setProcessingStage(null);
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

  const clearChat = () => {
    setMessages([]);
    setShowPdf(null);
    setProcessingStage(null);
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
          mdContent += `- ${cit.filename} (Page ${cit.page}) - Relevance: ${cit.confidence}\n`;
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

  const openPdf = (docId, page) => {
    setShowPdf({ docId, page });
    setTimeout(() => {
      if (pdfRef.current) {
        pdfRef.current.goToPage(page);
      }
    }, 300);
  };

  const latestAiMsg = [...messages].reverse().find(m => m.role === 'assistant' && (m.citations?.length > 0 || m.retrievalAnalytics));

  // Compute metrics for the right panel
  const citations = latestAiMsg?.citations || [];
  const uniqueDocs = new Set(citations.map(c => c.document_id)).size;
  const avgSimilarity = citations.length > 0 
    ? (citations.reduce((acc, c) => acc + c.confidence, 0) / citations.length).toFixed(0) 
    : 0;

  const totalQuestions = messages.filter(m => m.role === 'user').length;
  
  // Compute overall sources used in session
  const sessionUniqueDocs = new Set();
  messages.forEach(m => {
    if (m.citations) {
      m.citations.forEach(c => sessionUniqueDocs.add(c.document_id));
    }
  });

  return (
    <div className="chat-container" style={{ display: 'flex', height: 'calc(100vh - 4rem)', overflow: 'hidden' }}>
      
      {/* 1. Left Column - Document Selection */}
      <div className="chat-sidebar" style={{ width: '250px', display: 'flex', flexDirection: 'column', padding: '1.5rem', backgroundColor: 'var(--bg-light)', borderRight: '1px solid var(--border)', flexShrink: 0 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>Selected Documents</h3>
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
                  backgroundColor: selectedDocs.includes(doc.id) ? 'var(--white)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
              >
                <FileText size={16} color={selectedDocs.includes(doc.id) ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: selectedDocs.includes(doc.id) ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedDocs.includes(doc.id) ? 'var(--primary)' : 'var(--text-main)' }}>
                    {doc.filename}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
             <FileUp size={32} color="var(--border)" style={{ margin: '0 auto 1rem auto' }} />
             <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>No documents available.</p>
             <button className="btn-primary" onClick={() => navigate('/documents')} style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}>Upload</button>
          </div>
        )}
      </div>

      {/* 2. Middle Column - Conversation */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--white)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-light)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>ManifestIQ AI Assistant</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ask questions about your indexed supply-chain documents.</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={clearChat} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--white)' }}>
              <PlusCircle size={16} /> New Chat
            </button>
            <button onClick={exportChat} disabled={messages.length === 0} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--white)', opacity: messages.length === 0 ? 0.5 : 1 }}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <img src="/logo.svg" alt="ManifestIQ" style={{ width: '64px', height: '64px', marginBottom: '1.5rem', opacity: 0.8 }} />
              <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.5rem' }}>ManifestIQ AI</h2>
              <p style={{ marginBottom: '2rem' }}>Ask questions about your indexed supply-chain documents.</p>
              
              <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>Supported Formats</p>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Check size={16} color="var(--success)" /> PDF</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Check size={16} color="var(--success)" /> DOCX</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Check size={16} color="var(--success)" /> TXT</span>
                  </div>
                </div>

                {selectedDocs.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>Suggested Questions</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {['Summarize this document.', 'Explain payment terms.', 'Show delivery deadlines.'].map((sq, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleSend(sq)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontSize: '0.875rem',
                            color: 'var(--primary)',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          <HelpCircle size={16} /> {sq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id} style={{ display: 'flex', marginBottom: '2rem' }}>
                <div style={{ width: '40px', flexShrink: 0, marginRight: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: msg.role === 'user' ? 'var(--bg-light)' : 'var(--primary)',
                    color: msg.role === 'user' ? 'var(--text-secondary)' : 'var(--white)',
                    border: '1px solid var(--border)'
                  }}>
                    {msg.role === 'user' ? <User size={18} /> : <img src="/logo.svg" alt="AI" style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }} />}
                  </div>
                </div>
                
                <div style={{ flex: 1, maxWidth: 'calc(100% - 56px)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                    {msg.role === 'user' ? 'User' : 'ManifestIQ AI'}
                  </div>
                  
                  <div style={{ color: 'var(--text-main)' }}>
                    {msg.role === 'user' ? (
                      <div style={{ fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    ) : (
                      <div className="markdown-body">
                        {msg.text ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                        ) : (
                          // Processing Indicator
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                            <RefreshCw size={16} className="spin-animation" />
                            {processingStage === 'searching' && "Searching documents..."}
                            {processingStage === 'retrieving' && "Retrieving relevant chunks..."}
                            {processingStage === 'generating' && "Generating response..."}
                            <style>{`
                              @keyframes spin { 100% { transform: rotate(360deg); } }
                              .spin-animation { animation: spin 1s linear infinite; }
                            `}</style>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === 'assistant' && msg.text && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button onClick={() => copyToClipboard(msg.text)} className="btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', color: 'var(--text-muted)' }}>
                        <Copy size={14} /> Copy Answer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--white)', borderTop: '1px solid var(--border)' }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ position: 'relative' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedDocs.length > 0 ? "Ask a question..." : "Select a document to begin"}
              disabled={selectedDocs.length === 0 || loading}
              style={{ 
                width: '100%', 
                resize: 'none', 
                height: '80px', 
                padding: '1rem 3.5rem 1rem 1rem', 
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '1rem',
                lineHeight: '1.5',
                backgroundColor: 'var(--bg-light)',
                color: 'var(--text-main)',
                boxShadow: 'none'
              }}
            />
            <button 
              type="submit" 
              disabled={selectedDocs.length === 0 || !input.trim() || loading}
              style={{ 
                position: 'absolute',
                right: '1rem',
                bottom: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                width: '32px', height: '32px', 
                padding: 0,
                borderRadius: '6px',
                backgroundColor: (selectedDocs.length === 0 || !input.trim() || loading) ? 'transparent' : 'var(--primary)',
                color: (selectedDocs.length === 0 || !input.trim() || loading) ? 'var(--text-muted)' : 'white',
                border: 'none',
                cursor: (selectedDocs.length === 0 || !input.trim() || loading) ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
      
      {/* 3. Right Column - Sources & Metrics */}
      <div className="chat-right-panel" style={{ width: showPdf ? '500px' : '340px', flexShrink: 0, borderLeft: '1px solid var(--border)', backgroundColor: 'var(--bg-light)', display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease', position: 'relative', overflow: 'hidden' }}>
        
        {/* PDF Drawer Mode */}
        <AnimatePresence>
          {showPdf && (
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              style={{ position: 'absolute', inset: 0, zIndex: 20, backgroundColor: 'var(--white)', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} color="var(--primary)" /> Document Preview
                </div>
                <button onClick={() => setShowPdf(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <PdfViewer ref={pdfRef} fileUrl={`http://localhost:8000/api/documents/${showPdf.docId}/pdf`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Normal Sources & Metrics Mode */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <FileCheck size={16} color="var(--primary)" /> Knowledge Base
          </h3>
          <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', backgroundColor: 'rgba(37,99,235,0.1)', color: 'var(--primary)', borderRadius: '12px', fontWeight: 600 }}>
            {documents.length} Documents Indexed
          </span>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {latestAiMsg ? (
            <>
              {/* Card 1 - Sources */}
              {citations.length > 0 && (
                <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', margin: 0 }}>
                      <Database size={16} color="var(--primary)" /> Source Ranking
                    </h4>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-light)', color: 'var(--text-main)', borderRadius: '4px', fontWeight: 600, border: '1px solid var(--border)' }}>
                      Average Similarity: {avgSimilarity}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {citations.map((cit, idx) => (
                      <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-light)' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.5rem', wordBreak: 'break-all', display: 'flex', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span> {cit.filename}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          <span>Page {cit.page} {cit.total_pages ? `of ${cit.total_pages}` : ''}</span>
                          <span>Similarity: <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{Math.round(cit.confidence)}%</span></span>
                        </div>
                        <button 
                          onClick={() => openPdf(cit.document_id, cit.page)}
                          className="btn-outline" 
                          style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--white)' }}
                        >
                          <ExternalLink size={14} /> Preview
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card 2 - Metrics */}
              {latestAiMsg.retrievalAnalytics && (
                <div className="card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', margin: 0 }}>
                    <Cpu size={16} color="var(--primary)" /> Retrieval Statistics
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Documents Referenced</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{uniqueDocs}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Chunks Retrieved</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{latestAiMsg.retrievalAnalytics.chunk_count}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Average Similarity</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{avgSimilarity}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Response Time</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{latestAiMsg.retrievalAnalytics.total_time_ms ? (latestAiMsg.retrievalAnalytics.total_time_ms / 1000).toFixed(2) + ' sec' : '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Retrieval Time</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{latestAiMsg.retrievalAnalytics.time_ms} ms</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Model</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{latestAiMsg.retrievalAnalytics.model || 'Gemini Flash'}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginTop: '3rem' }}>
              Ask a question to see the source ranking and retrieval metrics.
            </div>
          )}
        </div>

        {/* Session Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--white)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Questions: <strong style={{ color: 'var(--text-main)' }}>{totalQuestions}</strong></span>
            <span>Sources Used: <strong style={{ color: 'var(--text-main)' }}>{sessionUniqueDocs.size}</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatPanel;
