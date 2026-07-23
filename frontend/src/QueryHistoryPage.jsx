import React, { useState, useEffect } from 'react';
import { Search, SearchX, MessageSquare } from 'lucide-react';
import api from './api';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';
import { motion } from 'framer-motion';

const QueryHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/api/query/history');
        setHistory(res.data);
      } catch (err) {
        console.error(err);
        // Fallback for when backend endpoint isn't ready
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    (item.query || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.document_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h1>Query History</h1>
        <p>Review past questions and answers across all your documents.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by keyword or document name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', padding: 0, outline: 'none', backgroundColor: 'transparent', width: '100%' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-light)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Query</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Document</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Date</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading history...
                </td>
              </tr>
            ) : filteredHistory.length > 0 ? (
              filteredHistory.map((item, i) => (
                <motion.tr 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  key={item.id} 
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{item.query}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.document_name || `Doc #${item.document_id}`}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(item.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <button className="btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={() => showToast('View Details feature coming soon!', 'success')}>View</button>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '4rem 2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <SearchX size={48} style={{ margin: '0 auto 1.5rem auto', color: 'var(--border)' }} />
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>No queries found</h3>
                    <p style={{ marginBottom: '1.5rem' }}>You haven't asked any questions yet.</p>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/chat')}>
                      <MessageSquare size={18} /> Go to Chat
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default QueryHistoryPage;
