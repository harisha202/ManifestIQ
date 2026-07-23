import React, { useState } from 'react';
import { Key } from 'lucide-react';

const SettingsPage = () => {
  const [apiKey, setApiKey] = useState('');
  
  const handleSave = (e) => {
    e.preventDefault();
    alert('API Key saved locally for this session.');
    // In a real app, you might send this to the backend or store it securely in local storage
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and integrations.</p>
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
