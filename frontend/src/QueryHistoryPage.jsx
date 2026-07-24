import React, { useState, useEffect } from 'react';
import { Search, SearchX, MessageSquare, Download } from 'lucide-react';
import api from './api';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';
import { motion } from 'framer-motion';

const QueryHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/api/query/history');
        setHistory(res.data.items || res.data);
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

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = ['Query', 'Document', 'Answer', 'Date', 'Response Time (ms)', 'Grounded'];
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map(row => {
        const escapedQuery = `"${(row.query || '').replace(/"/g, '""')}"`;
        const escapedDoc = `"${(row.document_name || '').replace(/"/g, '""')}"`;
        const escapedAnswer = `"${(row.answer || '').replace(/"/g, '""')}"`;
        const dateStr = `"${new Date(row.timestamp).toLocaleString()}"`;
        return `${escapedQuery},${escapedDoc},${escapedAnswer},${dateStr},${row.response_time_ms},${row.is_grounded ? 'Yes' : 'No'}`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'manifestiq_query_history.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported history to CSV", "success");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h1>Query History</h1>
        <p>Review past questions and answers across all your documents.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by keyword or document name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', padding: 0, outline: 'none', backgroundColor: 'transparent', width: '100%' }}
          />
        </div>
        <button className="btn-outline" onClick={handleExportCSV} disabled={filteredHistory.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
          <Download size={18} /> Export CSV
        </button>
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
              <>
                {[1, 2, 3].map((n) => (
                  <tr key={n} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1.25rem 1rem' }}><div className="skeleton" style={{ height: '20px', width: '80%' }}></div></td>
                    <td style={{ padding: '1.25rem 1rem' }}><div className="skeleton" style={{ height: '20px', width: '50%' }}></div></td>
                    <td style={{ padding: '1.25rem 1rem' }}><div className="skeleton" style={{ height: '20px', width: '60%' }}></div></td>
                    <td style={{ padding: '1.25rem 1rem' }}><div className="skeleton" style={{ height: '32px', width: '80px', borderRadius: '6px' }}></div></td>
                  </tr>
                ))}
              </>
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
                    <button className="btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={() => setSelectedQuery(item)}>View</button>
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

      {/* Detail Modal */}
      {selectedQuery && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--white)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Query Details</h2>
              <button onClick={() => setSelectedQuery(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Question</h4>
              <p style={{ fontWeight: 500, fontSize: '1.1rem' }}>{selectedQuery.query}</p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Answer</h4>
              <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: 'var(--bg-light)', padding: '1rem', borderRadius: '8px' }}>{selectedQuery.answer}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <div><strong>Document:</strong> {selectedQuery.document_name}</div>
              <div><strong>Date:</strong> {new Date(selectedQuery.timestamp).toLocaleString()}</div>
              <div><strong>Response Time:</strong> {selectedQuery.response_time_ms}ms</div>
              <div><strong>Grounded:</strong> {selectedQuery.is_grounded ? 'Yes' : 'No'}</div>
            </div>

            {selectedQuery.citations && selectedQuery.citations.length > 0 && (
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>Citations ({selectedQuery.citations.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selectedQuery.citations.map((cit, idx) => (
                    <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{cit.section}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Page {cit.page} • Relevance Score: {cit.confidence}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>"{cit.snippet}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default QueryHistoryPage;
