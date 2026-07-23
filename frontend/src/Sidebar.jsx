import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, MessageSquare, History, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img src="/logo.svg" alt="ManifestIQ Logo" style={{ width: '40px', height: '40px' }} />
        <h2>ManifestIQ</h2>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/documents" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Documents</span>
        </NavLink>
        <NavLink to="/chat" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquare size={20} />
          <span>Chat</span>
        </NavLink>
        <NavLink to="/history" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={20} />
          <span>Query History</span>
        </NavLink>
        <NavLink to="/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>
      
      <div className="sidebar-footer">
        <button className="nav-item" onClick={handleLogout} style={{width: '100%', background: 'transparent', textAlign: 'left', border: 'none'}}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
