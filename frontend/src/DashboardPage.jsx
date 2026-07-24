import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api';
import { Activity, Clock, CheckCircle, FileText, MessageSquare, Database, Server, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="card" 
    style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${color}` }}
  >
    <div style={{ color: color }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{title}</h3>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{value}</p>
    </div>
  </motion.div>
);

const SystemStatus = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/api/system/status');
        setStatus(res.data);
      } catch (err) {
        setStatus({
          database: { status: 'error' },
          vector_store: { status: 'error' },
          ai_model: { status: 'error' }
        });
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return <div className="skeleton" style={{ height: '100px', width: '100%' }}></div>;

  const renderStatusItem = (title, data, icon) => {
    const isOk = data.status === 'healthy';
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: isOk ? 'var(--chart-green)' : 'var(--error)' }}>
            {icon}
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>{title}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {data.latency_ms !== undefined ? `${data.latency_ms}ms` : data.size_mb !== undefined ? `${data.size_mb} MB` : ''}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOk ? 'var(--chart-green)' : 'var(--error)' }}></div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: isOk ? 'var(--chart-green)' : 'var(--error)', textTransform: 'capitalize' }}>
            {data.status.replace('_', ' ')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={20} color="var(--primary)" /> System Status
      </h3>
      {renderStatusItem("Database (PostgreSQL)", status.database, <Database size={20} />)}
      {renderStatusItem("Vector Store (FAISS)", status.vector_store, <Server size={20} />)}
      {renderStatusItem("AI Model (Gemini 1.5)", status.ai_model, <Cpu size={20} />)}
    </div>
  );
};

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/analytics/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header skeleton" style={{ width: '30%', height: '40px', marginBottom: '1rem' }}></div>
        <div className="skeleton" style={{ width: '50%', height: '20px', marginBottom: '2rem' }}></div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card skeleton" style={{ height: '100px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  const { overview, recent_activity } = stats || { overview: {}, recent_activity: [] };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's an overview of your RAG assistant.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Total Documents" value={overview.documents_uploaded || 0} icon={<FileText size={24} />} color="var(--chart-blue)" delay={0.1} />
        <StatCard title="Total Queries" value={overview.questions_asked || 0} icon={<MessageSquare size={24} />} color="var(--chart-purple)" delay={0.2} />
        <StatCard title="Average Response Time" value={overview.avg_response_time || "0s"} icon={<Clock size={24} />} color="var(--chart-green)" delay={0.3} />
        <StatCard title="Retrieval Accuracy" value={`${overview.percent_grounded || 0}%`} icon={<CheckCircle size={24} />} color="var(--chart-orange)" delay={0.4} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        <SystemStatus />
        
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
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
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-light)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 1rem auto', color: 'var(--border)' }} />
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.125rem' }}>No recent activity</h4>
              <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>Ask a question to see it here!</p>
              <Link to="/chat" className="btn-primary" style={{ display: 'inline-block' }}>Go to Chat</Link>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
