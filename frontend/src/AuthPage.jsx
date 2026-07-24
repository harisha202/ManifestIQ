import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import { CheckCircle } from 'lucide-react';
import { useToast } from './ToastContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      showToast('Session expired. Please sign in again.', 'warning');
      navigate('/auth', { replace: true });
    }
  }, [location, navigate, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      let payload;
      let config = {};

      if (isLogin) {
        payload = new URLSearchParams({ identifier: email, password: password });
        config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
      } else {
        payload = { username, email, password };
      }

      const response = await api.post(endpoint, payload, config);
      
      localStorage.setItem('token', response.data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Brand Panel */}
      <div style={{ flex: 1, backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem' }}>
        <img src="/logo.svg" alt="ManifestIQ Logo" style={{ width: '80px', height: '80px', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ffffff' }}>ManifestIQ</h1>
        <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '2rem' }}>
          Supply Chain Document Assistant powered by RAG.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#ffffff' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#10b981' }}>Project Purpose:</h3>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: '#ffffff', fontWeight: 500 }}>Upload and instantly index massive supply-chain documents like shipping manifests and vendor contracts.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: '#ffffff', fontWeight: 500 }}>Ask natural-language questions and get grounded answers powered by Gemini AI and Vector Search.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: '#ffffff', fontWeight: 500 }}>Always trace back to the source with automatically generated document citations.</span>
          </div>
        </div>
      </div>
      
      {/* Form Panel */}
      <div style={{ flex: 1, backgroundColor: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
            <button 
              onClick={() => { setIsLogin(true); setError(''); }}
              style={{ background: 'none', borderBottom: isLogin ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: 0, padding: '0.5rem 1rem', color: isLogin ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); }}
              style={{ background: 'none', borderBottom: !isLogin ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: 0, padding: '0.5rem 1rem', color: !isLogin ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              Sign Up
            </button>
          </div>
          
          <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</div>}
            
            {isLogin ? (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email or Username</label>
                <input type="text" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email or Username" autoComplete="new-password" />
              </div>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Username</label>
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)} placeholder="johndoe" autoComplete="new-password" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="new-password" />
                </div>
              </>
            )}
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </div>

            {!isLogin && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Confirm Password</label>
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
              </div>
            )}
            
            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              {isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
