import React, { useState, useEffect } from 'react';
import { Key, Moon, Sun } from 'lucide-react';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';

const SettingsPage = () => {
  const [apiKey, setApiKey] = useState('');
  const showToast = useToast();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);
  
  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey);
    showToast('API Key saved successfully for this session.', 'success');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and integrations.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isDark ? <Moon size={20} color="var(--primary)" /> : <Sun size={20} color="var(--primary)" />} Appearance
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Theme</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Toggle between light and dark mode.</div>
          </div>
          <button onClick={toggleTheme} className="btn-outline">
            {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={20} color="var(--primary)" /> API Integrations
        </h3>
        
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Gemini API Key</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Bring your own Gemini API key for RAG generation. If left blank, the system default key will be used.
            </p>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              placeholder="AIzaSy..." 
            />
          </div>
          
          <button type="submit" className="btn-primary">Save Settings</button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
