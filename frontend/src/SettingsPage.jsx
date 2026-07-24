import React, { useState, useEffect } from 'react';
import { Moon, Sun, User, Lock, Loader2 } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { useToast } from './ToastContext';
import api from './api';

const SettingsPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const showToast = useToast();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/auth/me');
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await api.post('/api/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      showToast("Password updated successfully", "success");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to change password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and appearance.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={20} color="var(--primary)" /> Profile
        </h3>
        
        {loading ? (
          <div className="skeleton" style={{ height: '60px', width: '100%', borderRadius: '6px' }}></div>
        ) : profile ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Username</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{profile.username}</div>
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{profile.email}</div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)' }}>Could not load profile.</div>
        )}
      </div>
      
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={20} color="var(--primary)" /> Security
        </h3>
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <div className="form-group">
            <label>Current Password</label>
            <input 
              type="password" 
              value={oldPassword} 
              onChange={e => setOldPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={isChangingPassword} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isChangingPassword && <Loader2 size={16} className="spin" />}
            Update Password
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
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
