import React, { useEffect, useState } from 'react';
import api from './api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/analytics/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const uploadTrends = stats?.uploadTrends || [];
  const volumeData = stats?.volumeData || [];
  const mostQueriedData = stats?.mostQueriedData || [];
  const docTypeData = stats?.docTypeData || [];
  const performanceTrends = stats?.performanceTrends || [];
  const uploadStatusData = stats?.uploadStatusData || [];
  const storageMetrics = stats?.storageMetrics || [];
  const largestDocsData = stats?.largestDocsData || [];

  const COLORS = ['var(--chart-blue)', 'var(--chart-purple)', 'var(--chart-green)', 'var(--chart-orange)'];
  const STATUS_COLORS = ['var(--success)', 'var(--error)', 'var(--warning)'];

  if (loading) {
    return (
      <div>
        <div className="page-header skeleton" style={{ width: '30%', height: '40px', marginBottom: '1rem' }}></div>
        <div className="skeleton" style={{ width: '50%', height: '20px', marginBottom: '2rem' }}></div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card skeleton" style={{ height: '300px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'var(--white)', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 600 }}>{label || payload[0].name}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ margin: 0, color: entry.color || entry.fill }}>
              {entry.name}: {entry.value} {entry.name.toLowerCase().includes('time') ? 'ms' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Monitor your RAG system's health, usage, and performance.</p>
      </div>

      {/* Usage Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-dark)' }}>
          Usage
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
          {/* 1. Documents Uploaded Over Time (Line) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Documents Uploaded Over Time</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Growth of the knowledge base</p>
            </div>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={uploadTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="uploads" name="Uploads" stroke="var(--chart-blue)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* 2. Questions Asked Over Time (Line) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Questions Asked Over Time</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>AI usage and user engagement</p>
            </div>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="queries" name="Queries" stroke="var(--chart-purple)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* 3. Most Queried Documents (Horizontal Bar) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Most Queried Documents</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Documents users rely on most</p>
            </div>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mostQueriedData} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} width={120} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Queries" fill="var(--chart-green)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* 4. Document Type Distribution (Pie) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Document Type Distribution</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Distribution of uploaded formats</p>
            </div>
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {docTypeData.length > 0 ? (
                <>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={docTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                        {docTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '40%' }}>
                    {docTypeData.map((entry, index) => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span style={{ color: 'var(--text-main)' }}>{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <span style={{ color: 'var(--text-muted)' }}>No data</span>}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Performance Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-dark)' }}>
          Performance
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
          {/* 5 & 6. Response and Retrieval Time (Line) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>System Latency (ms)</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>End-to-end vs Retrieval latency</p>
            </div>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="responseTime" name="Total Response Time" stroke="var(--chart-orange)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="retrievalTime" name="Vector Retrieval Time" stroke="var(--chart-blue)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* 7. Upload Success vs Failed (Pie) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card">
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Upload Reliability</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Success vs Failed document pipelines</p>
            </div>
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {uploadStatusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={uploadStatusData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value">
                        {uploadStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Success' ? STATUS_COLORS[0] : entry.name === 'Failed' ? STATUS_COLORS[1] : STATUS_COLORS[2]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '40%' }}>
                    {uploadStatusData.map((entry, index) => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: entry.name === 'Success' ? STATUS_COLORS[0] : entry.name === 'Failed' ? STATUS_COLORS[1] : STATUS_COLORS[2] }}></div>
                        <span style={{ color: 'var(--text-main)' }}>{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <span style={{ color: 'var(--text-muted)' }}>No data</span>}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Storage Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-dark)' }}>
          Storage
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
          {/* 8. Storage Usage (Pie) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card">
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Storage Usage (MB)</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Logical distribution of storage types</p>
            </div>
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {storageMetrics.length > 0 ? (
                <>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={storageMetrics} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                        {storageMetrics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '40%' }}>
                    {storageMetrics.map((entry, index) => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: COLORS[(index + 1) % COLORS.length] }}></div>
                        <span style={{ color: 'var(--text-main)' }}>{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <span style={{ color: 'var(--text-muted)' }}>No data</span>}
            </div>
          </motion.div>

          {/* 9. Top 10 Largest Documents (Table) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Top 10 Largest Documents</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Largest uploaded files and their indexing footprint</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem', fontWeight: 600 }}>Document</th>
                    <th style={{ padding: '0.75rem', fontWeight: 600 }}>Size</th>
                    <th style={{ padding: '0.75rem', fontWeight: 600 }}>Pages</th>
                    <th style={{ padding: '0.75rem', fontWeight: 600 }}>Chunks</th>
                  </tr>
                </thead>
                <tbody>
                  {largestDocsData.length > 0 ? largestDocsData.map((doc, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 500, color: 'var(--text-main)' }}>{doc.name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{doc.size_mb}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{doc.pages}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{doc.chunks}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No documents uploaded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;
