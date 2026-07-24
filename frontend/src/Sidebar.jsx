import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, MessageSquare, History, Settings, LogOut, BarChart2 } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img src="/logo.svg" alt="ManifestIQ Logo" style={{ width: '40px', height: '40px' }} />
        <h2>ManifestIQ</h2>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" onClick={onClose} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/documents" onClick={onClose} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Documents</span>
        </NavLink>
        <NavLink to="/chat" onClick={onClose} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquare size={20} />
          <span>Chat</span>
        </NavLink>
        <NavLink to="/history" onClick={onClose} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={20} />
          <span>Query History</span>
        </NavLink>
        <NavLink to="/analytics" onClick={onClose} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart2 size={20} />
          <span>Analytics</span>
        </NavLink>
        <NavLink to="/settings" onClick={onClose} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
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
