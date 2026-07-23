import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeContext';

const SettingsPage = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and appearance.</p>
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
    </div>
  );
};

export default SettingsPage;
