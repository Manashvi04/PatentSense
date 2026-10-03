import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { Activity, PlusCircle, Search, LogOut, User } from 'lucide-react';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <Activity size={24} style={{ stroke: 'url(#brand-grad-icon)', filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' }} />
        <span className="brand-gradient">PatentSense</span>
      </Link>
      
      {/* SVG linear gradient definitions for Lucide Icons */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <linearGradient id="brand-grad-icon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </svg>

      {user ? (
        <ul className="nav-links">
          <li>
            <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
              <Activity size={16} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/analyze" className={`nav-item ${isActive('/analyze') ? 'active' : ''}`}>
              <PlusCircle size={16} />
              Analyze
            </Link>
          </li>
          <li>
            <Link to="/patents" className={`nav-item ${isActive('/patents') ? 'active' : ''}`}>
              <Search size={16} />
              Patent DB
            </Link>
          </li>
          <li className="nav-item" style={{ 
            color: 'var(--text-primary)', 
            borderLeft: '1px solid var(--card-border)', 
            paddingLeft: '1.25rem', 
            marginLeft: '0.5rem',
            background: 'none'
          }}>
            <User size={16} style={{ color: 'var(--accent-secondary)' }} />
            <span>{user.fullName}</span>
          </li>
          <li>
            <button onClick={handleLogout} className="nav-item btn-logout" title="Log Out">
              <LogOut size={16} style={{ color: 'var(--color-danger)' }} />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      ) : (
        <ul className="nav-links">
          <li>
            <Link to="/login" className={`nav-item ${isActive('/login') ? 'active' : ''}`}>
              Login
            </Link>
          </li>
          <li>
            <Link to="/register" className={`nav-item ${isActive('/register') ? 'active' : ''}`}>
              Register
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
}
