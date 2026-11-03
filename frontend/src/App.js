import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DataCalonSiswa from './pages/DataCalonSiswa';
import DetailSiswa from './pages/DetailSiswa';
import EditSiswa from './pages/EditSiswa';
import DataSiswa from './pages/DataSiswa';
import PembayaranBaru from './pages/PembayaranBaru';
import InputBantuanSiswa from './pages/InputBantuanSiswa';
import Login from './pages/Login';
import TransaksiHarianKasir from './pages/TransaksiHarianKasir';
import KelasX from './pages/KelasX';
import KelasXI from './pages/KelasXI';
import KelasXII from './pages/KelasXII';
import TransaksiPembayaranSiswa from './pages/TransaksiPembayaranSiswa';
import LaporanSiswaPerKelas from './pages/LaporanSiswaPerKelas';
import LaporanKenaikanKelas from './pages/LaporanKenaikanKelas';
import RiwayatBantuanPerSiswa from './pages/RiwayatBantuanPerSiswa';
import LaporanRekapPerTahun from './pages/LaporanRekapPerTahun';
import TambahTarget from './pages/TambahTarget';
import './App.css';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailPage, setDetailPage] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      setIsLoggedIn(true);
    }
    
    // Ekspos fungsi setDetailPage ke window untuk digunakan oleh komponen lain
    window.setDetailPage = setDetailPage;
  }, []);

  const handleLogin = async (formData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      const data = await response.json();
      if (response.ok) {
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userData', JSON.stringify(data.user));
          setIsLoggedIn(true);
        } else if (data.requiresVerification) {
          // Jika memerlukan verifikasi OTP, Login component akan handle ini
          console.log('Account requires OTP verification');
        } else {
          alert(data.error || 'Login failed');
        }
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleRegister = async (formData) => {
    // Fungsi ini tidak lagi diperlukan karena setelah OTP verification
    // user akan kembali ke halaman login untuk login manual
    console.log('Registration handled by Login component');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setDetailPage(null);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarMouseLeave = () => {
    setSidebarOpen(false);
  };

  const handleBackToMenu = () => {
    setDetailPage(null);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // Jika ada halaman detail yang aktif, tampilkan halaman detail atau edit
  if (detailPage) {
    console.log("Menampilkan halaman detail untuk ID:", detailPage.id, "Type:", detailPage.type, "Mode:", detailPage.mode);
    return (
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
        <Sidebar 
          onMenuClick={setActiveMenu} 
          activeMenu={activeMenu} 
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onSidebarToggle={handleSidebarToggle}
          onMouseLeave={handleSidebarMouseLeave}
        />
        <div style={{ 
          flex: 1, 
          background: '#f7f7f7', 
          marginLeft: sidebarOpen ? 260 : 0,
          transition: 'margin-left 0.3s ease',
          position: 'relative'
        }}>
          {/* Header dengan toggle button */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: sidebarOpen ? 260 : 0,
            right: 0,
            height: '60px',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            zIndex: 1200,
            transition: 'left 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px'
          }}>
            <button 
              className="sidebar-toggle-external"
              onClick={handleSidebarToggle}
              aria-label="Toggle sidebar"
            >
              <span className="toggle-bar"></span>
              <span className="toggle-bar"></span>
              <span className="toggle-bar"></span>
            </button>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1976d2',
              letterSpacing: '1px'
            }}>
              SMK PALAPA PARE
            </div>
          </div>
          
          <div style={{ padding: '80px 24px 24px 24px' }}>
            {/* Tampilkan DetailSiswa atau EditSiswa berdasarkan mode */}
            {detailPage.type === 'siswa' && detailPage.mode === 'detail' && (
              <DetailSiswa 
                id={detailPage.id} 
                onBack={handleBackToMenu}
                onEdit={(id) => setDetailPage({ id, type: 'siswa', mode: 'edit' })}
              />
            )}
            {detailPage.type === 'siswa' && detailPage.mode === 'edit' && (
              <EditSiswa 
                id={detailPage.id} 
                onBack={() => setDetailPage({ id: detailPage.id, type: 'siswa', mode: 'detail' })}
                onCancel={handleBackToMenu}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <Sidebar 
        onMenuClick={setActiveMenu} 
        activeMenu={activeMenu} 
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onSidebarToggle={handleSidebarToggle}
        onMouseLeave={handleSidebarMouseLeave}
      />
      <div style={{ 
        flex: 1, 
        background: '#f7f7f7', 
        marginLeft: sidebarOpen ? 260 : 0,
        transition: 'margin-left 0.3s ease',
        position: 'relative'
      }}>
        {/* Header dengan toggle button */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 260 : 0,
          right: 0,
          height: '60px',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          zIndex: 1200,
          transition: 'left 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px'
        }}>
          <button 
            className="sidebar-toggle-external"
            onClick={handleSidebarToggle}
            aria-label="Toggle sidebar"
          >
            <span className="toggle-bar"></span>
            <span className="toggle-bar"></span>
            <span className="toggle-bar"></span>
          </button>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1976d2',
            letterSpacing: '1px'
          }}>
            SMK PALAPA PARE
          </div>
        </div>
        
        {activeMenu === 'dashboard' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <Dashboard />
          </div>
        )}
        {activeMenu === 'calon' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <DataCalonSiswa />
          </div>
        )}
        {activeMenu === 'siswa' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <DataSiswa onDetailClick={(id) => setDetailPage({ id, type: 'siswa', mode: 'detail' })} />
          </div>
        )}
        {activeMenu === 'pembayaran' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <PembayaranBaru />
          </div>
        )}
        {activeMenu === 'input-bantuan' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <InputBantuanSiswa />
          </div>
        )}
        {activeMenu === 'tambah-target' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <TambahTarget />
          </div>
        )}
        {activeMenu === 'transaksi-harian-kasir' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <TransaksiHarianKasir />
          </div>
        )}
        {activeMenu === 'transaksi-pembayaran' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <TransaksiPembayaranSiswa />
          </div>
        )}
        {activeMenu === 'kasir' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
              <h2>Kasir Pemasukan dan Pengeluaran</h2>
              <p>Halaman ini sedang dalam pengembangan</p>
            </div>
          </div>
        )}
        {activeMenu === 'laporan-siswa' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <LaporanSiswaPerKelas />
          </div>
        )}
        {activeMenu === 'laporan-bantuan' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <RiwayatBantuanPerSiswa />
          </div>
        )}
        {activeMenu === 'kelas-x' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <KelasX />
          </div>
        )}
        {activeMenu === 'kelas-xi' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <KelasXI />
          </div>
        )}
        {activeMenu === 'kelas-xii' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <KelasXII />
          </div>
        )}
        {activeMenu === 'rincian-biaya' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
              <h2>Rincian Biaya</h2>
              <p>Halaman ini sedang dalam pengembangan</p>
            </div>
          </div>
        )}
        {activeMenu === 'laporan-kenaikan-kelas' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <LaporanKenaikanKelas />
          </div>
        )}
        {activeMenu === 'laporan-rekap-per-tahun' && (
          <div style={{ padding: '80px 24px 24px 24px' }}>
            <LaporanRekapPerTahun />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;