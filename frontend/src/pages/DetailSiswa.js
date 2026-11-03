import React, { useState, useEffect } from 'react';

// Constants
const API_BASE_URL = 'http://localhost:5000/api';

// Styling Constants
const styles = {
  container: { 
    padding: '24px', 
    background: '#f8fafc', 
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: { 
    fontSize: '28px', 
    fontWeight: '700', 
    marginBottom: '8px',
    color: '#1f2937'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '16px',
    margin: 0
  },
  card: { 
    background: '#fff', 
    borderRadius: '12px', 
    padding: '32px', 
    marginBottom: '24px', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb'
  },
  sectionTitle: { 
    fontSize: '18px', 
    fontWeight: '600', 
    marginBottom: '20px', 
    color: '#374151',
    paddingBottom: '12px',
    borderBottom: '2px solid #e5e7eb'
  },
  backButton: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    background: 'none', 
    border: '1px solid #d1d5db',
    color: '#374151', 
    cursor: 'pointer',
    fontSize: '14px',
    padding: '10px 16px',
    borderRadius: '8px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  backButtonHover: {
    background: '#f3f4f6',
    borderColor: '#9ca3af'
  },
  editButton: { 
    background: '#3b82f6', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '8px', 
    padding: '10px 20px', 
    fontWeight: '600', 
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  editButtonHover: {
    background: '#2563eb'
  },
  avatar: { 
    width: '100px', 
    height: '100px', 
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
    borderRadius: '50%', 
    margin: '0 auto 20px auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '36px',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
  },
  statusBadge: { 
    background: '#d1fae5', 
    color: '#10b981', 
    padding: '6px 16px', 
    borderRadius: '20px', 
    fontSize: '12px', 
    fontWeight: '600',
    display: 'inline-block',
    marginBottom: '20px'
  },
  infoContainer: { 
    display: 'grid', 
    gap: '16px' 
  },
  additionalInfo: { 
    background: '#f8fafc', 
    padding: '20px', 
    borderRadius: '8px', 
    border: '1px solid #e5e7eb',
    minHeight: '100px'
  },
  additionalInfoText: { 
    margin: '0', 
    lineHeight: '1.6', 
    color: '#4b5563',
    fontSize: '14px'
  }
};

// Helper Components
const LoadingSpinner = () => (
  <div style={{ 
    textAlign: 'center', 
    padding: '60px 20px',
    background: '#f8fafc',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: '4px solid #e2e8f0',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    }}></div>
    <div style={{
      fontSize: '18px',
      color: '#64748b',
      fontWeight: '500'
    }}>Memuat data siswa...</div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

const ErrorDisplay = ({ error, onBack }) => (
  <div style={{ 
    textAlign: 'center', 
    padding: '60px 20px',
    background: '#f8fafc',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <div style={{
      fontSize: '48px',
      marginBottom: '16px',
      color: '#ef4444'
    }}>⚠️</div>
    <div style={{ 
      color: '#ef4444', 
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '24px',
      maxWidth: '400px'
    }}>
      {error || 'Data tidak ditemukan'}
    </div>
    <button 
      onClick={onBack} 
      style={{ 
        padding: '12px 24px', 
        background: '#3b82f6', 
        color: 'white', 
        border: 'none', 
        borderRadius: '8px', 
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        transition: 'background-color 0.2s'
      }}
      onMouseOver={(e) => e.target.style.background = '#2563eb'}
      onMouseOut={(e) => e.target.style.background = '#3b82f6'}
    >
      Kembali ke Daftar
    </button>
  </div>
);

const InfoItem = ({ label, value }) => (
  <div style={{ display: 'flex', gap: '12px' }}>
    <span style={{ 
      fontWeight: '600', 
      color: '#4b5563', 
      minWidth: '140px', 
      display: 'inline-block',
      fontSize: '14px'
    }}>
      {label}:
    </span>
    <span style={{ 
      color: value ? '#1f2937' : '#9ca3af',
      fontSize: '14px',
      flex: 1
    }}>
      {value || 'Tidak Diketahui'}
    </span>
  </div>
);

const StatusBadge = ({ status }) => {
  const getStatusInfo = (status) => {
    if (status === 1) return { label: 'Aktif', color: '#10b981', bg: '#d1fae5' };
    if (status === 0) return { label: 'Tidak Aktif', color: '#ef4444', bg: '#fee2e2' };
    return { label: 'Status Tidak Diketahui', color: '#f59e0b', bg: '#fef3c7' };
  };

  const statusInfo = getStatusInfo(status);
  
  return (
    <div style={{ 
      background: statusInfo.bg, 
      color: statusInfo.color, 
      padding: '6px 16px', 
      borderRadius: '20px', 
      fontSize: '12px', 
      fontWeight: '600',
      display: 'inline-block',
      marginBottom: '20px'
    }}>
      {statusInfo.label}
    </div>
  );
};

const Avatar = ({ name }) => (
  <div style={styles.avatar}>
    {name ? name.charAt(0).toUpperCase() : '?'}
  </div>
);

// Helper Functions
const getJurusanLabel = (jurusanId) => {
  if (jurusanId === 1) return 'Teknik Grafika (TG)';
  if (jurusanId === 2) return 'Rekayasa Perangkat Lunak (RPL)';
  return 'Belum Dipilih';
};

const getKelasLabel = (kelasId) => {
  if (kelasId === 1) return 'X (Sepuluh)';
  if (kelasId === 2) return 'XI (Sebelas)';
  if (kelasId === 3) return 'XII (Dua Belas)';
  return 'Belum Ditentukan';
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Main Component
const DetailSiswa = ({ id, onBack, onEdit }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/siswa/${id}`);
      if (!response.ok) {
        throw new Error('Data tidak ditemukan');
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    if (typeof onEdit === 'function') {
      onEdit(id);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !data) {
    return <ErrorDisplay error={error} onBack={onBack} />;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Detail Data Siswa</h1>
          <p style={styles.subtitle}>Informasi lengkap siswa SMK Palapa</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={onBack}
            style={styles.backButton}
            onMouseOver={(e) => Object.assign(e.target.style, styles.backButtonHover)}
            onMouseOut={(e) => {
              e.target.style.background = 'none';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            <span>←</span>
            Kembali
          </button>
          <button 
            onClick={handleEditClick}
            style={styles.editButton}
            onMouseOver={(e) => e.target.style.background = styles.editButtonHover.background}
            onMouseOut={(e) => e.target.style.background = styles.editButton.background}
          >
            Edit Data
          </button>
        </div>
      </div>

      {/* Card 1 - Informasi Utama */}
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {/* Kolom Kiri - Profil */}
          <div style={{ flex: '1', minWidth: '250px', textAlign: 'center' }}>
            <Avatar name={data.nama} />
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              {data.nama || 'Nama Tidak Diketahui'}
            </h2>
            <StatusBadge status={data.status} />
            <div style={{
              color: '#6b7280',
              fontSize: '14px',
              marginTop: '8px'
            }}>
              ID Siswa: {data.id_siswa}
            </div>
            {data.nis && (
              <div style={{
                color: '#6b7280',
                fontSize: '14px',
                marginTop: '4px'
              }}>
                NIS: {data.nis}
              </div>
            )}
          </div>

          {/* Kolom Tengah - Informasi Pribadi */}
          <div style={{ flex: '2', minWidth: '300px' }}>
            <h3 style={styles.sectionTitle}>Informasi Pribadi</h3>
            <div style={styles.infoContainer}>
              <InfoItem 
                label="Jenis Kelamin" 
                value={data.jenis_kelamin === 'L' ? 'Laki-laki' : data.jenis_kelamin === 'P' ? 'Perempuan' : data.jenis_kelamin} 
              />
              <InfoItem label="Tempat Lahir" value={data.tempat_lahir} />
              <InfoItem label="Tanggal Lahir" value={formatDate(data.tgl_lahir)} />
              <InfoItem label="Alamat" value={data.alamat} />
              <InfoItem label="Nomor Telepon" value={data.no_telp} />
              <InfoItem label="Agama" value={data.agama} />
            </div>
          </div>

          {/* Kolom Kanan - Informasi Akademik */}
          <div style={{ flex: '1', minWidth: '250px' }}>
            <h3 style={styles.sectionTitle}>Informasi Akademik</h3>
            <div style={styles.infoContainer}>
              <InfoItem label="Jurusan" value={getJurusanLabel(data.jurusan_id)} />
              <InfoItem label="Kelas" value={getKelasLabel(data.kelas_id)} />
              <InfoItem label="Tanggal Daftar" value={formatDate(data.tgl_daftar)} />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2 - Informasi Keluarga */}
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {/* Kolom Kiri - Informasi Orang Tua */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h3 style={styles.sectionTitle}>Informasi Orang Tua/Wali</h3>
            <div style={styles.infoContainer}>
              <InfoItem label="Nama Orang Tua" value={data.nama_ortu} />
            </div>
          </div>

          {/* Kolom Kanan - Informasi Tambahan */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h3 style={styles.sectionTitle}>Informasi Tambahan</h3>
            <div style={styles.additionalInfo}>
              <p style={{ 
                ...styles.additionalInfoText,
                fontStyle: data.informasi_tambahan ? 'normal' : 'italic'
              }}>
                {data.informasi_tambahan || 'Data tambahan dapat ditambahkan sesuai kebutuhan sekolah.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default DetailSiswa;