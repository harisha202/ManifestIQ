import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin 
        ? new URLSearchParams({ username: username, password: password }) // OAuth2 expects form data for login
        : { username, email, password }; // Custom JSON for signup
        
      const config = isLogin 
        ? { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        : {};

      const response = await axios.post(`http://localhost:8000${endpoint}`, payload, config);
      
      localStorage.setItem('token', response.data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Brand Panel */}
      <div style={{ flex: 1, backgroundColor: 'var(--primary-bg)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem' }}>
        <img src="/logo.svg" alt="ManifestIQ Logo" style={{ width: '80px', height: '80px', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'white' }}>ManifestIQ</h1>
        <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', marginBottom: '2rem' }}>
          Supply Chain Document Assistant powered by RAG.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--white)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Project Purpose:</h3>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <CheckCircle size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Upload and instantly index massive supply-chain documents like shipping manifests and vendor contracts.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <CheckCircle size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Ask natural-language questions and get grounded answers powered by Gemini AI and Vector Search.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <CheckCircle size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Always trace back to the source with automatically generated document citations.</span>
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
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</div>}
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Username</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} placeholder="johndoe" />
            </div>

            {!isLogin && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
            )}
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {!isLogin && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Confirm Password</label>
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
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
