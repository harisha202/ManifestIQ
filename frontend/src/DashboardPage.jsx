import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from './api';
import { Activity, Clock, CheckCircle, FileText, MessageSquare, Database, Server, Cpu, Upload, FileUp, BarChart2, History } from 'lucide-react';
import { motion } from 'framer-motion';

const QuickActionCard = ({ title, icon, color, link, delay }) => (
  <Link to={link} style={{ display: 'block' }}>
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="card"
      style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        gap: '1rem', padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid var(--border)',
        height: '100%'
      }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ color: color, padding: '1rem', backgroundColor: 'var(--bg-light)', borderRadius: '50%' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{title}</h3>
    </motion.div>
  </Link>
);

const SystemStatus = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/api/health'); // Using new health endpoint
        setStatus(res.data);
      } catch (err) {
        setStatus({
          database: { status: 'error' },
          vector_store: { status: 'error' },
          llm: { status: 'error' }
        });
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return <div className="skeleton card" style={{ height: '300px', width: '100%' }}></div>;

  const renderStatusItem = (title, data, icon) => {
    // Determine status from the new /health format: 'connected', 'ready', 'available' are healthy states.
    const isOk = ['connected', 'ready', 'available'].includes(data.status);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: isOk ? 'var(--chart-green)' : 'var(--error)' }}>
            {icon}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{title}</h4>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isOk ? 'var(--chart-green)' : 'var(--error)', textTransform: 'capitalize' }}>
            {data.status.replace('_', ' ')}
          </span>
          {data.latency !== undefined && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {data.latency} ms
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-light)' }}>
        <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Activity size={18} color="var(--primary)" /> System Status
        </h3>
      </div>
      <div>
        {renderStatusItem("Database", status.database, <Database size={20} />)}
        {renderStatusItem("Vector Store", status.vector_store, <Server size={20} />)}
        {renderStatusItem("Gemini", status.llm, <Cpu size={20} />)}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, userRes] = await Promise.all([
          api.get('/api/analytics/dashboard'),
          api.get('/api/auth/me').catch(() => ({ data: { username: 'User' } })) // Fallback if me endpoint fails
        ]);
        setStats(statsRes.data);
        setUser(userRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="page-header skeleton" style={{ width: '30%', height: '40px', marginBottom: '1rem' }}></div>
        <div className="skeleton" style={{ width: '50%', height: '20px', marginBottom: '2rem' }}></div>
      </div>
    );
  }

  const { overview = {}, recent_activity = [], documents_uploaded = 0, last_upload = null } = stats || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ padding: '2rem' }}>
      
      {/* Welcome Banner */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--primary)', color: 'white', padding: '2.5rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'white' }}>Welcome back</h1>
          <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1.5rem' }}>Your knowledge base is ready.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
              <span style={{ fontSize: '0.875rem' }}>{documents_uploaded || overview.documents_uploaded || 0} Documents Indexed</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {last_upload && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'var(--white)', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Last Upload</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {last_upload.filename}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="section-spacing">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <QuickActionCard title="Upload Document" icon={<FileUp size={28} />} color="var(--chart-blue)" link="/documents" delay={0.1} />
          <QuickActionCard title="Ask AI" icon={<MessageSquare size={28} />} color="var(--chart-purple)" link="/chat" delay={0.2} />
          <QuickActionCard title="Analytics" icon={<BarChart2 size={28} />} color="var(--chart-green)" link="/analytics" delay={0.3} />
          <QuickActionCard title="Query History" icon={<History size={28} />} color="var(--chart-orange)" link="/history" delay={0.4} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        <SystemStatus />
        
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-light)' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Clock size={18} color="var(--text-main)" /> Recent Activity
            </h3>
          </div>
          {recent_activity.length > 0 ? (
            <div>
              {recent_activity.slice(0, 5).map((activity, idx) => (
                <div key={activity.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: idx < recent_activity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                    "{activity.query}"
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Doc ID: {activity.document_id}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 1rem auto', color: 'var(--border)' }} />
              <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>Ask a question to see it here!</p>
              <Link to="/chat" className="btn-outline" style={{ display: 'inline-block' }}>Go to Chat</Link>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
