import React from 'react';
import './FloatingMenu.css';

const menuList = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'pembayaran', label: 'Pembayaran Baru', icon: '💳' },
  { key: 'input-bantuan', label: 'Input Bantuan', icon: '🎁' },
  { key: 'transaksi-harian-kasir', label: 'Transaksi Harian', icon: '📅' },
  { key: 'profil', label: 'Profil', icon: '👤' },
];

const FloatingMenu = ({ open, setOpen, onMenuClick, activeMenu, onLogout }) => {
  return (
    <div className="floating-menu-container">
      {/* Menu pop-up */}
      <div className={`floating-menu-popup${open ? ' show' : ''}`}>
        {menuList.map(menu => (
          <button
            key={menu.key}
            className={`floating-menu-btn${activeMenu === menu.key ? ' active' : ''}`}
            onClick={() => onMenuClick(menu.key)}
          >
            <span className="floating-menu-icon">{menu.icon}</span>
            <span>{menu.label}</span>
          </button>
        ))}
        <button className="floating-menu-btn logout" onClick={onLogout}>
          <span className="floating-menu-icon">🚪</span> Logout
        </button>
      </div>
      {/* Tombol setengah lingkaran */}
      <button
        className={`floating-fab${open ? ' open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <div className="fab-half-circle" />
        <span className="fab-icon">☰</span>
      </button>
    </div>
  );
};

export default FloatingMenu;
