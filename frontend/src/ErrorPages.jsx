import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, WifiOff, ServerCrash } from 'lucide-react';
import { motion } from 'framer-motion';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
      <AlertCircle size={64} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Page not found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>The page you are looking for doesn't exist or has been moved.</p>
      <button className="btn-primary" onClick={() => navigate('/')}>Return Home</button>
    </motion.div>
  );
};

export const ServerErrorPage = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
      <ServerCrash size={64} color="var(--error)" style={{ marginBottom: '1.5rem' }} />
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>500</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Something went wrong</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Our servers are experiencing issues. Please try again later.</p>
      <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </motion.div>
  );
};
