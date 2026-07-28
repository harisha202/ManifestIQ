import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import { 
  UploadCloud, Bot, FileText, Shield, ShieldCheck, 
  Sparkles, Grid, Zap, Database, Mail, Lock, 
  Eye, EyeOff, ArrowRight, Sun, Moon, User 
} from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* 1. Left Side Panel: Dark Navy Enterprise Brand Panel */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#030D1E', 
        color: '#FFFFFF', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        padding: '3.5rem 4rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 1 }}>
          <img src="/logo.svg" alt="ManifestIQ" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
          <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Manifest<span style={{ color: '#10B981' }}>IQ</span>
          </span>
        </div>

        {/* Hero Section */}
        <div style={{ my: 'auto', zIndex: 1, maxWidth: '680px', marginTop: '2.5rem', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.9rem', 
            fontWeight: 800, 
            lineHeight: 1.2, 
            color: '#FFFFFF', 
            marginBottom: '1.25rem',
            letterSpacing: '-0.75px'
          }}>
            Enterprise Document Intelligence<br/>
            for <span style={{ color: '#10B981' }}>Supply Chain Operations</span>
          </h1>
          <p style={{ fontSize: '1.125rem', lineHeight: 1.65, color: '#94A3B8', marginBottom: '2.5rem', maxWidth: '600px' }}>
            Upload, index and analyze your supply chain documents. Ask questions in natural language and get accurate, grounded answers with source citations.
          </p>

          {/* Feature Grid Section */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 700, 
              color: '#10B981', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em', 
              marginBottom: '1.25rem' 
            }}>
              What ManifestIQ helps you do
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.15rem' }}>
              {/* Card 1: Upload Documents */}
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: '12px', 
                padding: '1.35rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem'
              }}>
                <div style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                  padding: '0.65rem', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <UploadCloud size={24} color="#10B981" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.4rem' }}>Upload Documents</h4>
                  <p style={{ fontSize: '0.925rem', color: '#94A3B8', lineHeight: 1.45, margin: 0 }}>
                    Upload shipping manifests, contracts, invoices and other supply chain docs.
                  </p>
                </div>
              </div>

              {/* Card 2: AI-Powered Search */}
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: '12px', 
                padding: '1.35rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem'
              }}>
                <div style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                  padding: '0.65rem', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={24} color="#10B981" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.4rem' }}>AI-Powered Search</h4>
                  <p style={{ fontSize: '0.925rem', color: '#94A3B8', lineHeight: 1.45, margin: 0 }}>
                    Ask anything about your documents using natural language.
                  </p>
                </div>
              </div>

              {/* Card 3: Grounded Answers */}
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: '12px', 
                padding: '1.35rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem'
              }}>
                <div style={{ 
                  backgroundColor: 'rgba(37, 99, 235, 0.15)', 
                  padding: '0.65rem', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText size={24} color="#3B82F6" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.4rem' }}>Grounded Answers</h4>
                  <p style={{ fontSize: '0.925rem', color: '#94A3B8', lineHeight: 1.45, margin: 0 }}>
                    Get precise answers with citations from your uploaded documents.
                  </p>
                </div>
              </div>

              {/* Card 4: Secure & Private */}
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: '12px', 
                padding: '1.35rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem'
              }}>
                <div style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                  padding: '0.65rem', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Shield size={24} color="#10B981" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.4rem' }}>Secure & Private</h4>
                  <p style={{ fontSize: '0.925rem', color: '#94A3B8', lineHeight: 1.45, margin: 0 }}>
                    Enterprise-grade security to keep your data safe and compliant.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Powered By Section */}
          <div>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 700, 
              color: '#10B981', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em', 
              marginBottom: '1rem' 
            }}>
              Powered By
            </h3>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '8px', 
                padding: '0.65rem 1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem',
                fontSize: '1rem',
                fontWeight: 600
              }}>
                <Sparkles size={20} color="#818CF8" />
                <span>Gemini</span>
              </div>

              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '8px', 
                padding: '0.65rem 1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem',
                fontSize: '1rem',
                fontWeight: 600
              }}>
                <Grid size={20} color="#38BDF8" />
                <span>FAISS</span>
              </div>

              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '8px', 
                padding: '0.65rem 1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem',
                fontSize: '1rem',
                fontWeight: 600
              }}>
                <Zap size={20} color="#10B981" />
                <span>FastAPI</span>
              </div>

              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '8px', 
                padding: '0.65rem 1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem',
                fontSize: '1rem',
                fontWeight: 600
              }}>
                <Database size={20} color="#60A5FA" />
                <span>PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Left Side Bottom Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontSize: '0.8rem', 
          color: '#64748B', 
          borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
          paddingTop: '1.5rem',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} color="#10B981" />
            <span>© 2026 ManifestIQ. All rights reserved.</span>
          </div>
          <span>Version 1.0.0</span>
        </div>
      </div>

      {/* 2. Right Side Panel: Light Patterned Background with White Floating Auth Card */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#F8FAFC', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        padding: '3.5rem', 
        position: 'relative' 
      }}>
        {/* Subtle Background Watermarks */}
        <div style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)', 
          backgroundSize: '24px 24px', 
          opacity: 0.6, 
          pointerEvents: 'none' 
        }} />

        {/* Top spacing filler */}
        <div />

        {/* Floating Auth Card */}
        <div style={{ 
          width: '100%', 
          maxWidth: '440px', 
          margin: '0 auto',
          backgroundColor: '#FFFFFF', 
          borderRadius: '16px', 
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)', 
          border: '1px solid #E2E8F0',
          padding: '2.5rem 2rem',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Top Tabs */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            borderBottom: '1px solid #E2E8F0', 
            marginBottom: '2rem' 
          }}>
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              style={{ 
                background: 'none', 
                border: 'none', 
                borderBottom: isLogin ? '2px solid #2563EB' : '2px solid transparent', 
                padding: '0.75rem 1rem', 
                fontSize: '0.95rem',
                fontWeight: isLogin ? 600 : 500,
                color: isLogin ? '#2563EB' : '#64748B', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Log In
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              style={{ 
                background: 'none', 
                border: 'none', 
                borderBottom: !isLogin ? '2px solid #2563EB' : '2px solid transparent', 
                padding: '0.75rem 1rem', 
                fontSize: '0.95rem',
                fontWeight: !isLogin ? 600 : 500,
                color: !isLogin ? '#2563EB' : '#64748B', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{ 
                backgroundColor: '#FEF2F2', 
                border: '1px solid #FECACA', 
                color: '#DC2626', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                fontSize: '0.85rem',
                fontWeight: 500 
              }}>
                {error}
              </div>
            )}

            {/* Fields for Sign Up */}
            {!isLogin && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                  Username
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px' }} />
                  <input 
                    type="text" 
                    required 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Enter your username" 
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 1rem 0.75rem 2.5rem', 
                      borderRadius: '8px', 
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      transition: 'border-color 0.2s'
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Email / Username Field */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                {isLogin ? 'Email or Username' : 'Email Address'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px' }} />
                <input 
                  type="text" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder={isLogin ? "Enter your email or username" : "Enter your email address"} 
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem 0.75rem 2.5rem', 
                    borderRadius: '8px', 
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF'
                  }} 
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px' }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Enter your password" 
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 2.5rem 0.75rem 2.5rem', 
                    borderRadius: '8px', 
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF'
                  }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center' 
                  }}
                >
                  {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                </button>
              </div>
            </div>

            {/* Confirm Password for Sign Up */}
            {!isLogin && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px' }} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm your password" 
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 2.5rem 0.75rem 2.5rem', 
                      borderRadius: '8px', 
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF'
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Forgot Password Link (Only for Log In) */}
            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.25rem' }}>
                <a 
                  href="#forgot" 
                  onClick={(e) => { e.preventDefault(); showToast('Password reset link sent to your email.', 'info'); }}
                  style={{ fontSize: '0.85rem', color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}
                >
                  Forgot Password?
                </a>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                marginTop: '0.5rem',
                backgroundColor: '#2563EB', 
                color: '#FFFFFF', 
                border: 'none', 
                borderRadius: '8px', 
                padding: '0.85rem 1rem', 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'background-color 0.2s'
              }}
            >
              <span>{loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>

        {/* Right Side Bottom Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontSize: '0.8rem', 
          color: '#64748B', 
          zIndex: 2 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={16} color="#64748B" />
            </span>
            <a href="#privacy" onClick={(e) => { e.preventDefault(); showToast('Privacy Policy: All document data is encrypted.', 'info'); }} style={{ color: '#64748B', textDecoration: 'none' }}>Privacy Policy</a>
            <span>|</span>
            <a href="#terms" onClick={(e) => { e.preventDefault(); showToast('Terms of Service applied.', 'info'); }} style={{ color: '#64748B', textDecoration: 'none' }}>Terms of Service</a>
            <span>|</span>
            <a href="#contact" onClick={(e) => { e.preventDefault(); showToast('Contact support@manifestiq.com', 'info'); }} style={{ color: '#64748B', textDecoration: 'none' }}>Contact Us</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sun size={16} color="#64748B" />
            <div style={{ width: '36px', height: '20px', borderRadius: '12px', backgroundColor: '#E2E8F0', position: 'relative' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: '2px', left: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
            </div>
            <Moon size={16} color="#64748B" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
