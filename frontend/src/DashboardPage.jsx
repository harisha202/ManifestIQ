import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, MessageSquare, Clock, CheckCircle } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ backgroundColor: `${color}20`, color: color, padding: '1rem', borderRadius: '8px' }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{title}</h3>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{value}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/api/analytics/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  const { overview, recent_activity } = stats || { overview: {}, recent_activity: [] };

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's an overview of your RAG assistant usage.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Documents Uploaded" value={overview.documents_uploaded || 0} icon={<FileText size={24} />} color="#1D9E75" />
        <StatCard title="Questions Asked" value={overview.questions_asked || 0} icon={<MessageSquare size={24} />} color="#3B82F6" />
        <StatCard title="Avg Response Time" value={overview.avg_response_time || "0s"} icon={<Clock size={24} />} color="#8B5CF6" />
        <StatCard title="% Grounded Answers" value={`${overview.percent_grounded || 0}%`} icon={<CheckCircle size={24} />} color="#10B981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Query Volume</h3>
            <select style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div style={{ height: '200px', backgroundColor: 'var(--bg-light)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            [ Chart Placeholder: Bar chart representing questions per day ]
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <Link to="/documents" className="btn-primary" style={{ textAlign: 'center' }}>Upload New Document</Link>
            <Link to="/chat" className="btn-outline" style={{ textAlign: 'center' }}>Go to Chat</Link>
          </div>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Activity</h3>
        {recent_activity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recent_activity.map(activity => (
              <div key={activity.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-light)', borderRadius: '6px' }}>
                <span style={{ fontWeight: 500 }}>"{activity.query}"</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Doc ID: {activity.document_id}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-light)', borderRadius: '6px' }}>
            No recent activity. Ask a question to see it here!
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
