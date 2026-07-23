import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

const ChatPanel = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/documents/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
      if (res.data.length > 0) {
        setSelectedDoc(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedDoc) return;

    const userMsg = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8000/api/query/ask', 
        { document_id: selectedDoc, query: userMsg.text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const assistantMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: res.data.answer,
        citation: res.data.citation,
        isGrounded: res.data.is_grounded
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: 'Sorry, I encountered an error while processing your question.',
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 4rem)', gap: '1.5rem' }}>
      
      {/* Document Selection Sidebar */}
      <div className="card" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Select Document</h3>
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
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <FileText size={16} color={selectedDoc === doc.id ? 'var(--primary)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.875rem', fontWeight: selectedDoc === doc.id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.filename}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
            No documents uploaded.
          </p>
        )}
      </div>

      {/* Chat Area */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--bg-light)' }}>
          {messages.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Select a document and ask a question to begin.
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--white)',
                  color: msg.role === 'user' ? 'var(--white)' : 'var(--text-main)',
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  lineHeight: '1.5'
                }}>
                  {msg.text}
                </div>
                
                {/* Grounding Badge and Citation */}
                {msg.role === 'assistant' && !msg.isError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                    {msg.isGrounded ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)' }}>
                        <CheckCircle size={12} /> Grounded
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)' }}>
                        <AlertTriangle size={12} /> Not found in document
                      </span>
                    )}
                    
                    {msg.citation && (
                      <span style={{ color: 'var(--text-muted)' }}>Citation: {msg.citation}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--white)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', gap: '0.25rem' }}>
              <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--white)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedDoc ? "Ask a question about the document... (Shift+Enter for new line)" : "Please select a document first"}
              disabled={!selectedDoc || loading}
              style={{ flex: 1, resize: 'none', height: '50px', padding: '0.75rem' }}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!selectedDoc || !input.trim() || loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', padding: 0 }}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
