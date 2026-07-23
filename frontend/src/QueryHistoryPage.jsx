import React, { useState } from 'react';
import { Search } from 'lucide-react';

const QueryHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data for prototype
  const history = [
    { id: 1, query: "What is the penalty for late delivery?", doc_name: "Vendor_SLA_2023.pdf", date: "2023-10-25" },
    { id: 2, query: "Are customs fees included?", doc_name: "Shipping_Manifest_09.pdf", date: "2023-10-24" },
    { id: 3, query: "What are the payment terms?", doc_name: "Vendor_SLA_2023.pdf", date: "2023-10-20" }
  ];

  const filteredHistory = history.filter(item => 
    item.query.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.doc_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
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
            style={{ border: 'none', padding: 0, outline: 'none' }}
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
            {filteredHistory.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{item.query}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.doc_name}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.date}</td>
                <td style={{ padding: '1rem' }}>
                  <button className="btn-outline" style={{ padding: '0.5rem 1rem' }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredHistory.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No matching queries found.
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryHistoryPage;
