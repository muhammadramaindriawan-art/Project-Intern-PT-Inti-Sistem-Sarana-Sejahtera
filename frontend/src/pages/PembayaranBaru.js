import React, { useState, useEffect } from 'react';

const PembayaranBaru = () => {
  const [filterNama, setFilterNama] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Opsi kelas sesuai dengan struktur sistem
  const kelasOptions = [
    { value: '', label: 'Semua Kelas' },
    { value: 'X', label: 'X - Semua Jurusan' },
    { value: 'XI', label: 'XI - Semua Jurusan' },
    { value: 'XII', label: 'XII - Semua Jurusan' },
    { value: 'X-TG', label: 'X - Teknik Grafika' },
    { value: 'X-RPL', label: 'X - RPL' },
    { value: 'XI-TG', label: 'XI - Teknik Grafika' },
    { value: 'XI-RPL', label: 'XI - RPL' },
    { value: 'XII-TG', label: 'XII - Teknik Grafika' },
    { value: 'XII-RPL', label: 'XII - RPL' }
  ];
  
  // Opsi kelas untuk form (tanpa "Semua Kelas")
  const kelasFormOptions = kelasOptions.filter(opt => opt.value !== '');
  const [formData, setFormData] = useState({
    nama: '',
    kelas: '',
    total: '',
    sisa: '',
    bayar: '',
    metode: 'Tunai',
    tanggal: '',
    keterangan: ''
  });
  const [pembayaranList, setPembayaranList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Fetch data pembayaran dari API
  useEffect(() => {
    const fetchPembayaran = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/pembayaran');
        const result = await response.json();
        
        if (result.success) {
          const formattedData = result.data.map(item => ({
            ...item,
            tanggal: item.tanggal ? item.tanggal.slice(0, 10) : ''
          }));
          setPembayaranList(formattedData);
        } else {
          setError('Gagal mengambil data pembayaran');
        }
      } catch (error) {
        console.error('Error fetching payment data:', error);
        setError('Terjadi kesalahan saat mengambil data pembayaran');
      } finally {
        setLoading(false);
      }
    };

    fetchPembayaran();
  }, []);

  // Helper function untuk normalize kelas format
  const normalizeKelas = (kelas) => {
    if (!kelas) return '';
    // Konversi format lama ke format baru
    const kelasStr = kelas.toString().toUpperCase().trim();
    if (kelasStr.includes('10')) {
      if (kelasStr.includes('TG')) return 'X-TG';
      if (kelasStr.includes('RPL')) return 'X-RPL';
      return 'X';
    }
    if (kelasStr.includes('11')) {
      if (kelasStr.includes('TG')) return 'XI-TG';
      if (kelasStr.includes('RPL')) return 'XI-RPL';
      return 'XI';
    }
    if (kelasStr.includes('12')) {
      if (kelasStr.includes('TG')) return 'XII-TG';
      if (kelasStr.includes('RPL')) return 'XII-RPL';
      return 'XII';
    }
    return kelasStr;
  };

  // Helper function untuk memeriksa apakah kelas cocok dengan filter
  const matchesKelasFilter = (rowKelas, filterKelas) => {
    if (!filterKelas || filterKelas === '') return true;
    
    const normalizedRowKelas = normalizeKelas(rowKelas);
    const normalizedFilterKelas = filterKelas.toUpperCase().trim();
    
    // Jika filter adalah kelas umum (X, XI, XII) tanpa jurusan
    if (normalizedFilterKelas === 'X' || normalizedFilterKelas === 'XI' || normalizedFilterKelas === 'XII') {
      return normalizedRowKelas.startsWith(normalizedFilterKelas);
    }
    
    // Jika filter adalah kelas dengan jurusan spesifik (X-TG, XI-RPL, dll)
    return normalizedRowKelas === normalizedFilterKelas || 
           normalizedRowKelas.includes(normalizedFilterKelas);
  };

  // Filter data pembayaran
  const filteredData = pembayaranList.filter((row) => {
    const matchNama = row.nama_siswa 
      ? row.nama_siswa.toLowerCase().includes(filterNama.toLowerCase())
      : true;
    const matchKelas = matchesKelasFilter(row.kelas, filterKelas);
    const matchJurusan = filterJurusan 
      ? row.jurusan === filterJurusan 
      : true;
    return matchNama && matchKelas && matchJurusan;
  });

  // Validasi form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nama) errors.nama = 'Nama siswa harus diisi';
    if (!formData.kelas) errors.kelas = 'Kelas harus dipilih';
    // Hapus validasi total dan sisa
    if (!formData.bayar || isNaN(parseFloat(formData.bayar)) || parseFloat(formData.bayar) <= 0) 
      errors.bayar = 'Jumlah bayar harus berupa angka positif';
    if (!formData.metode) errors.metode = 'Metode pembayaran harus dipilih';
    if (!formData.tanggal) errors.tanggal = 'Tanggal pembayaran harus diisi';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit form pembayaran
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Format data untuk API - status selalu "Sukses"
      const paymentData = {
        nama_siswa: formData.nama,
        kelas: formData.kelas,
        jumlah_bayar: parseFloat(formData.bayar),
        metode: formData.metode,
        tanggal: formData.tanggal,
        status: 'Sukses',
        keterangan: formData.keterangan || ''
      };
      
      // Kirim data ke API
      const response = await fetch('http://localhost:5000/api/pembayaran', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage('Pembayaran berhasil disimpan!');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Refresh data pembayaran
        const refreshResponse = await fetch('http://localhost:5000/api/pembayaran');
        const refreshResult = await refreshResponse.json();
        
        if (refreshResult.success) {
          const formattedData = refreshResult.data.map(item => ({
            ...item,
            tanggal: item.tanggal ? item.tanggal.slice(0, 10) : ''
          }));
          setPembayaranList(formattedData);
        }
        
        setShowForm(false);
        setFormData({
          nama: '',
          kelas: '',
          total: '',
          sisa: '',
          bayar: '',
          metode: 'Tunai',
          tanggal: '',
          keterangan: ''
        });
        setFormErrors({});
      } else {
        setError(result.error || 'Gagal menyimpan pembayaran');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      setError('Terjadi kesalahan saat menyimpan pembayaran');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menampilkan status - PERBAIKAN
  const statusLabel = (status) => {
    const statusText = (status || '').toUpperCase();
    if (statusText === 'SUKSES' || statusText === 'LUNAS')
      return <span className="status sukses">{statusText}</span>;
    if (statusText === 'PROSES')
      return <span className="status proses">PROSES</span>;
    if (statusText === 'GAGAL')
      return <span className="status gagal">GAGAL</span>;
    return <span className="status">-</span>;
  };

  // Styles
  const styles = {
    container: {
      padding: '32px 24px', 
      background: '#f8fafc', 
      minHeight: '100vh',
      margin: 0,
      boxSizing: 'border-box'
    },
    notification: {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      maxWidth: '90%',
      textAlign: 'center'
    },
    header: {
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 32,
      background: '#fff',
      padding: '24px 32px',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    headerTitle: {
      fontSize: 24, 
      fontWeight: 700, 
      margin: 0, 
      marginBottom: 4,
      color: '#1a202c'
    },
    headerSubtitle: {
      margin: 0, 
      color: '#718096', 
      fontSize: 14 
    },
    addButton: {
      background: '#4ea8de', 
      color: '#fff', 
      border: 'none', 
      borderRadius: 8, 
      padding: '12px 24px', 
      fontWeight: 600, 
      fontSize: 14, 
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      transition: 'all 0.2s ease'
    },
    card: {
      background: '#fff', 
      borderRadius: 12, 
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    filterContainer: {
      padding: 24, 
      marginBottom: 24
    },
    filterTitle: {
      margin: 0, 
      marginBottom: 20, 
      fontSize: 16, 
      fontWeight: 600,
      color: '#2d3748'
    },
    filterInput: {
      width: '100%', 
      padding: '12px 16px', 
      borderRadius: 8, 
      border: '1px solid #e2e8f0',
      fontSize: 14,
      boxSizing: 'border-box'
    },
    tableHeader: {
      padding: '24px 32px 20px 32px',
      borderBottom: '1px solid #e2e8f0'
    },
    tableTitle: {
      margin: 0, 
      fontSize: 16, 
      fontWeight: 600,
      color: '#2d3748'
    },
    tableHeaderCell: {
      padding: '16px 24px', 
      textAlign: 'left', 
      fontSize: 13, 
      fontWeight: 600, 
      color: '#4a5568', 
      borderBottom: '1px solid #e2e8f0'
    },
    tableHeaderCellCenter: {
      padding: '16px 24px', 
      textAlign: 'center', 
      fontSize: 13, 
      fontWeight: 600, 
      color: '#4a5568', 
      borderBottom: '1px solid #e2e8f0'
    },
    tableCell: {
      padding: '16px 24px',
      verticalAlign: 'middle'
    },
    tableCellCenter: {
      padding: '16px 24px',
      verticalAlign: 'middle',
      textAlign: 'center'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    modalContent: {
      background: '#ffffff',
      borderRadius: '0',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      maxWidth: '700px',
      width: '100%',
      maxHeight: '85vh',
      overflowY: 'auto',
      animation: 'slideIn 0.3s ease-out',
      marginTop: '80px'
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 32px 0 32px',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '0'
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'none',
      border: 'none',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      padding: '8px 12px',
      borderRadius: '6px',
      transition: 'all 0.2s ease'
    },
    modalTitle: {
      margin: 0,
      fontSize: '24px',
      fontWeight: '700',
      color: '#111827',
      letterSpacing: '-0.025em'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '6px',
      transition: 'all 0.2s ease'
    },
    formContainer: {
      padding: '24px', 
      marginTop: '0'
    },
    formSection: {
      marginBottom: '24px'
    },
    formSectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '18px',
      fontWeight: '600',
      color: '#374151',
      margin: '0 0 16px 0',
      paddingBottom: '10px',
      borderBottom: '2px solid #e5e7eb'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px'
    },
    formField: {
      display: 'flex', 
      flexDirection: 'column'
    },
    formLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    formInput: {
      padding: '10px 14px',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      background: '#ffffff',
      color: '#111827'
    },
    errorText: {
      color: '#ef4444',
      fontSize: '12px',
      marginTop: '4px'
    },
    formActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '16px',
      paddingTop: '20px',
      borderTop: '1px solid #e5e7eb',
      marginTop: '24px'
    },
    submitButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      color: 'white',
      boxShadow: '0 4px 12px rgba(78, 168, 222, 0.3)'
    }
  };

  return (
    <div style={styles.container}>
      {/* Notifikasi Sukses */}
      {successMessage && (
        <div style={{...styles.notification, background: '#10b981', color: 'white'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{successMessage}</span>
        </div>
      )}
      
      {/* Notifikasi Error */}
      {error && (
        <div style={{...styles.notification, background: '#ef4444', color: 'white'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Pembayaran Baru</h1>
          <p style={styles.headerSubtitle}>Kelola transaksi pembayaran siswa</p>
        </div>
        <button 
          style={styles.addButton}
          onClick={() => setShowForm(true)}
        >
          <span style={{ fontSize: 16 }}>+</span>
          Tambah Pembayaran
        </button>
      </div>

      {/* Filter Section */}
      <div style={{...styles.card, ...styles.filterContainer}}>
        <h3 style={styles.filterTitle}>Filter & Pencarian</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 250 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 14, 
              fontWeight: 500,
              color: '#4a5568'
            }}>
              Cari Nama Siswa
            </label>
            <input
              type="text"
              placeholder="Masukkan nama siswa..."
              value={filterNama}
              onChange={e => setFilterNama(e.target.value)}
              style={styles.filterInput}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 14, 
              fontWeight: 500,
              color: '#4a5568'
            }}>
              Kelas
            </label>
            <select 
              value={filterKelas} 
              onChange={e => setFilterKelas(e.target.value)} 
              style={styles.filterInput}
            >
              {kelasOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 14, 
              fontWeight: 500,
              color: '#4a5568'
            }}>
              Jurusan
            </label>
            <select 
              value={filterJurusan} 
              onChange={e => setFilterJurusan(e.target.value)} 
              style={styles.filterInput}
            >
              <option value="">Semua Jurusan</option>
              <option value="RPL">RPL</option>
              <option value="TG">TG</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div style={styles.card}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Daftar Transaksi Pembayaran</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7fafc' }}>
              <tr>
                <th style={styles.tableHeaderCell}>Tanggal</th>
                <th style={styles.tableHeaderCell}>ID</th>
                <th style={styles.tableHeaderCell}>Nama Siswa</th>
                <th style={styles.tableHeaderCell}>Kelas</th>
                <th style={styles.tableHeaderCell}>Jumlah Bayar</th>
                <th style={styles.tableHeaderCell}>Metode</th>
                <th style={styles.tableHeaderCell}>Keterangan</th>
                <th style={styles.tableHeaderCellCenter}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '20px', height: '20px', border: '3px solid #e2e8f0', borderTopColor: '#4ea8de', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#718096' }}>
                    Tidak ada data pembayaran
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={styles.tableCell}>{row.tanggal ? row.tanggal.slice(0, 10) : '-'}</td>
                    <td style={styles.tableCell}>{row.id}</td>
                    <td style={styles.tableCell}>{row.nama_siswa}</td>
                    <td style={styles.tableCell}>{row.kelas}</td>
                    <td style={styles.tableCell}>Rp {row.jumlah_bayar?.toLocaleString('id-ID')}</td>
                    <td style={styles.tableCell}>{row.metode}</td>
                    <td style={styles.tableCell}>{row.keterangan || '-'}</td>
                    <td style={styles.tableCellCenter}>
                      {statusLabel(row.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={() => setShowForm(false)} style={styles.backButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Kembali
                </button>
                <h2 style={styles.modalTitle}>Tambah Pembayaran Baru</h2>
              </div>
              <button onClick={() => setShowForm(false)} style={styles.closeButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.formContainer}>
              <div style={styles.formSection}>
                <h3 style={styles.formSectionTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Informasi Pembayaran
                </h3>
                <div style={styles.formGrid}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      Nama Siswa
                    </label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={e => setFormData({...formData, nama: e.target.value})}
                      style={{
                        ...styles.formInput,
                        borderColor: formErrors.nama ? '#ef4444' : '#e5e7eb'
                      }}
                      placeholder="Masukkan nama siswa (wajib diisi)"
                    />
                    {formErrors.nama && <span style={styles.errorText}>{formErrors.nama}</span>}
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      Kelas
                    </label>
                    <select
                      value={formData.kelas}
                      onChange={e => setFormData({...formData, kelas: e.target.value})}
                      style={{
                        ...styles.formInput,
                        borderColor: formErrors.kelas ? '#ef4444' : '#e5e7eb'
                      }}
                    >
                      <option value="">Pilih Kelas (wajib dipilih)</option>
                      {kelasFormOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {formErrors.kelas && <span style={styles.errorText}>{formErrors.kelas}</span>}
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      Jumlah Bayar
                    </label>
                    <input
                      type="number"
                      value={formData.bayar}
                      onChange={e => setFormData({...formData, bayar: e.target.value})}
                      style={{
                        ...styles.formInput,
                        borderColor: formErrors.bayar ? '#ef4444' : '#e5e7eb'
                      }}
                      placeholder="500000 (wajib diisi)"
                      min="0"
                      step="0.01"
                    />
                    {formErrors.bayar && <span style={styles.errorText}>{formErrors.bayar}</span>}
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      Metode Pembayaran
                    </label>
                    <select
                      value={formData.metode}
                      onChange={e => setFormData({...formData, metode: e.target.value})}
                      style={{
                        ...styles.formInput,
                        borderColor: formErrors.metode ? '#ef4444' : '#e5e7eb'
                      }}
                    >
                      <option value="">Pilih Metode (wajib dipilih)</option>
                      <option value="Tunai">Tunai</option>
                      <option value="KIP">KIP</option>
                      <option value="GNOTA">GNOTA</option>
                      <option value="BKSM">BKSM</option>
                    </select>
                    {formErrors.metode && <span style={styles.errorText}>{formErrors.metode}</span>}
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      Tanggal Pembayaran
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        value={formData.tanggal}
                        onChange={e => setFormData({...formData, tanggal: e.target.value})}
                        style={{
                          ...styles.formInput,
                          width: '100%',
                          borderColor: formErrors.tanggal ? '#ef4444' : '#e5e7eb'
                        }}
                      />
                    </div>
                    {formErrors.tanggal && <span style={styles.errorText}>{formErrors.tanggal}</span>}
                  </div>
                  {/* Field Keterangan */}
                  <div style={{...styles.formField, gridColumn: '1 / -1'}}>
                    <label style={styles.formLabel}>
                      Keterangan
                    </label>
                    <textarea
                      value={formData.keterangan}
                      onChange={e => setFormData({...formData, keterangan: e.target.value})}
                      style={{...styles.formInput, minHeight: 60, resize: 'vertical'}}
                      placeholder="Keterangan tambahan (opsional)"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div style={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    ...styles.submitButton,
                    background: '#6b7280',
                    color: 'white'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.submitButton,
                    background: loading ? '#94a3b8' : 'linear-gradient(135deg, #4ea8de 0%, #3b82f6 100%)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 12px rgba(78, 168, 222, 0.3)'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17,21 17,13 7,13 7,21"/>
                        <polyline points="7,3 7,8 15,8"/>
                      </svg>
                      Simpan Pembayaran
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .status {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          min-width: 90px;
          text-align: center;
          line-height: 1;
        }
        .status.sukses { 
          background: #10b981; 
          color: #fff; 
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
          border: 1px solid #0fa271;
        }
        .status.proses { 
          background: #f59e0b; 
          color: #fff; 
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
          border: 1px solid #e58e08;
        }
        .status.gagal { 
          background: #ef4444; 
          color: #fff; 
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
          border: 1px solid #e53535;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #4ea8de !important;
          box-shadow: 0 0 0 3px rgba(78, 168, 222, 0.1);
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        tr:hover {
          background: #f7fafc;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default PembayaranBaru;