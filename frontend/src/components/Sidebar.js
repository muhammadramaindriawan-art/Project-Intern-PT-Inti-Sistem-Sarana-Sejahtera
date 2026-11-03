import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ onMenuClick, activeMenu, onLogout, isOpen, onSidebarToggle, onMouseLeave }) => {
  const [showPendaftaranModal, setShowPendaftaranModal] = useState(false);
  const [showPembagianKelasModal, setShowPembagianKelasModal] = useState(false);

  // Fungsi untuk menangani klik menu dan menutup dropdown
  const handleMenuClick = (menuName) => {
    onMenuClick(menuName);
    setShowPendaftaranModal(false);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`} onMouseLeave={onMouseLeave}>
      <div className="sidebar-header">
      </div>
      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="sidebar-title">MENU UTAMA</div>
          <button className={`sidebar-btn${activeMenu === 'dashboard' ? ' active' : ''}`} onClick={() => handleMenuClick('dashboard')}>
            <span className="sidebar-icon">📊</span> Dashboard
          </button>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-title">TRANSAKSI</div>
          <button
  className={`sidebar-btn${activeMenu === 'transaksi-pembayaran' ? ' active' : ''}`}
  onClick={() => handleMenuClick('transaksi-pembayaran')}
>
  <span className="sidebar-icon">💰</span> Transaksi Pembayaran Siswa
</button>
          <button className={`sidebar-btn${activeMenu === 'pembayaran' ? ' active' : ''}`} onClick={() => handleMenuClick('pembayaran')}><span className="sidebar-icon">💳</span> Pembayaran Baru</button>
          <div className="sidebar-dropdown">
            <button className="sidebar-btn sidebar-dropdown-toggle" onClick={() => setShowPendaftaranModal(!showPendaftaranModal)}>
              <span className="sidebar-icon">📝</span> Pendaftaran Siswa Baru
              <span className="dropdown-arrow" style={{ 
                transform: showPendaftaranModal ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                marginLeft: 'auto'
              }}>▼</span>
            </button>
            {showPendaftaranModal && (
              <div className="sidebar-dropdown-menu">
                <button 
                  className={`sidebar-btn dropdown-item${activeMenu === 'calon' ? ' active' : ''}`}
                  onClick={() => handleMenuClick('calon')}
                >
                  <span className="sidebar-icon">📋</span> Data Calon Siswa
                </button>
                <button 
                  className={`sidebar-btn dropdown-item${activeMenu === 'siswa' ? ' active' : ''}`}
                  onClick={() => handleMenuClick('siswa')}
                >
                  <span className="sidebar-icon">👨‍🎓</span> Data Siswa
                </button>
              </div>
            )}
          </div>
          <div className="sidebar-dropdown">
            <button
              className="sidebar-btn sidebar-dropdown-toggle"
              onClick={() => setShowPembagianKelasModal(!showPembagianKelasModal)}
            >
              <span className="sidebar-icon">🏫</span> Pembagian Kelas Siswa
              <span
                className="dropdown-arrow"
                style={{
                  transform: showPembagianKelasModal ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                  marginLeft: 'auto'
                }}
              >▼</span>
            </button>
            {showPembagianKelasModal && (
              <div className="sidebar-dropdown-menu">
                <button
                  className={`sidebar-btn dropdown-item${activeMenu === 'kelas-x' ? ' active' : ''}`}
                  onClick={() => handleMenuClick('kelas-x')}
                >
                  <span className="sidebar-icon"></span> Kelas X
                </button>
                <button
                  className={`sidebar-btn dropdown-item${activeMenu === 'kelas-xi' ? ' active' : ''}`}
                  onClick={() => handleMenuClick('kelas-xi')}
                >
                  <span className="sidebar-icon"></span> Kelas XI
                </button>
                <button
                  className={`sidebar-btn dropdown-item${activeMenu === 'kelas-xii' ? ' active' : ''}`}
                  onClick={() => handleMenuClick('kelas-xii')}
                >
                  <span className="sidebar-icon"></span> Kelas XII
                </button>
              </div>
            )}
          </div>
          <button className={`sidebar-btn${activeMenu === 'input-bantuan' ? ' active' : ''}`} onClick={() => handleMenuClick('input-bantuan')}><span className="sidebar-icon">🎁</span> Input Bantuan Siswa</button>
          <button className={`sidebar-btn${activeMenu === 'tambah-target' ? ' active' : ''}`} onClick={() => handleMenuClick('tambah-target')}><span className="sidebar-icon">🎯</span> Tambah Target</button>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-title">LAPORAN</div>
          <button className={`sidebar-btn${activeMenu === 'transaksi-harian-kasir' ? ' active' : ''}`} onClick={() => handleMenuClick('transaksi-harian-kasir')}><span className="sidebar-icon">📅</span> Laporan Harian Kasir</button>
          <button className={`sidebar-btn${activeMenu === 'laporan-siswa' ? ' active' : ''}`} onClick={() => handleMenuClick('laporan-siswa')}><span className="sidebar-icon">📄</span> Laporan Siswa</button>
          <button className={`sidebar-btn${activeMenu === 'laporan-kenaikan-kelas' ? ' active' : ''}`} onClick={() => handleMenuClick('laporan-kenaikan-kelas')}>
  <span className="sidebar-icon">⬆️</span> Laporan Kenaikan Kelas
</button>
          <button className={`sidebar-btn${activeMenu === 'laporan-bantuan' ? ' active' : ''}`} onClick={() => handleMenuClick('laporan-bantuan')}>
  <span className="sidebar-icon">🎁</span> Riwayat Bantuan Siswa
</button>
          <button className={`sidebar-btn${activeMenu === 'laporan-rekap-per-tahun' ? ' active' : ''}`} onClick={() => handleMenuClick('laporan-rekap-per-tahun')}>
  <span className="sidebar-icon">📊</span> Laporan Rekap Per Tahun
</button>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-title">SETTING</div>
        </div>
        <div className="sidebar-section logout-section">
          <button 
            className="sidebar-btn" 
            onClick={onLogout}
            style={{ background: '#ff6b6b', color: 'white', border: 'none', fontWeight: '600' }}
          >
            <span className="sidebar-icon">🚪</span> Logout
          </button>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;