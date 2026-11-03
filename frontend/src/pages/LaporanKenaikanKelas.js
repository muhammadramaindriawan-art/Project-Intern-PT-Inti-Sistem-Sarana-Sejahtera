import React, { useState, useEffect } from "react";

const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: 24,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 24,
    color: '#1a202c'
  },
  filterCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0'
  },
  filterRow: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-end',
    flexWrap: 'wrap'
  },
  inputGroup: {
    flex: 1,
    minWidth: 200
  },
  label: {
    display: 'block',
    marginBottom: 8,
    fontWeight: 600,
    color: '#2d3748',
    fontSize: 14
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #cbd5e0',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  buttonGroup: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap'
  },
  primaryButton: {
    padding: '12px 24px',
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#1565c0'
    }
  },
  cancelButton: {
    padding: '12px 24px',
    background: '#fbc02d',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#f9a825'
    }
  },
  exitButton: {
    padding: '12px 24px',
    background: '#e53935',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#d32f2f'
    }
  },
  tableCard: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    border: '1px solid #e2e8f0'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14
  },
  thead: {
    background: '#f7fafc',
    borderBottom: '2px solid #e2e8f0'
  },
  th: {
    padding: 16,
    textAlign: 'left',
    fontWeight: 600,
    color: '#2d3748',
    fontSize: 14,
    whiteSpace: 'nowrap'
  },
  tr: {
    borderBottom: '1px solid #f1f3f5',
    transition: 'background 0.2s',
    '&:hover': {
      background: '#f8f9fa'
    }
  },
  td: {
    padding: 16,
    color: '#4a5568'
  },
  emptyCell: {
    textAlign: 'center',
    padding: 48,
    color: '#a0aec0',
    fontSize: 14
  },
  statusNaik: {
    color: '#2e7d32',
    fontWeight: 600,
    padding: '4px 8px',
    background: '#e8f5e8',
    borderRadius: 4,
    fontSize: 12
  },
  statusTinggal: {
    color: '#d32f2f',
    fontWeight: 600,
    padding: '4px 8px',
    background: '#ffebee',
    borderRadius: 4,
    fontSize: 12
  },
  statusBelum: {
    color: '#f57c00',
    fontWeight: 600,
    padding: '4px 8px',
    background: '#fff3e0',
    borderRadius: 4,
    fontSize: 12
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontSize: 14
  },
  errorText: {
    textAlign: 'center',
    padding: 20,
    color: '#d32f2f',
    fontSize: 14,
    background: '#ffebee',
    borderRadius: 8,
    margin: '10px 0'
  }
};

// Mapping untuk opsi filter yang sesuai dengan database
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

export default function LaporanKenaikanKelas() {
  const [kelas, setKelas] = useState('');
  const [idSiswa, setIdSiswa] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Reset error ketika filter berubah
  useEffect(() => {
    setError('');
  }, [kelas, idSiswa, tahun]);

  const handleTampilkan = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (kelas && kelas.trim() !== '') {
        params.append('kelas', kelas.trim());
      }
      if (idSiswa && idSiswa.toString().trim() !== '') {
        // Validasi ID siswa harus angka
        const id = parseInt(idSiswa.toString().trim());
        if (isNaN(id) || id <= 0) {
          throw new Error('ID Siswa harus berupa angka positif');
        }
        params.append('id_siswa', id.toString());
      }
      if (tahun && tahun.toString().trim() !== '') {
        params.append('tahun', tahun.toString().trim());
      }
      
      const queryString = params.toString();
      const url = queryString 
        ? `http://localhost:5000/api/laporan/kenaikan-kelas?${queryString}`
        : `http://localhost:5000/api/laporan/kenaikan-kelas`;
      
      console.log('Fetching from:', url);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
      }
      
      const result = await res.json();
      
      // Pastikan result adalah array
      if (!Array.isArray(result)) {
        throw new Error('Format data tidak valid dari server');
      }
      
      setData(result);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Gagal mengambil data dari server');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setKelas('');
    setIdSiswa('');
    setTahun(new Date().getFullYear());
    setData([]);
    setError('');
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Naik':
        return styles.statusNaik;
      case 'Tinggal':
        return styles.statusTinggal;
      case 'Belum Ada Tagihan':
        return styles.statusBelum;
      default:
        return {};
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Laporan Kenaikan Kelas</h1>
      
      <div style={styles.filterCard}>
        <div style={styles.filterRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Kelas & Jurusan</label>
            <select
              value={kelas}
              onChange={e => setKelas(e.target.value)}
              style={styles.input}
            >
              {kelasOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>ID Siswa</label>
            <input
              type="number"
              value={idSiswa}
              onChange={e => setIdSiswa(e.target.value)}
              style={styles.input}
              placeholder="Masukkan ID siswa (angka)"
              min="1"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Tahun Daftar</label>
            <input
              type="number"
              value={tahun}
              onChange={e => setTahun(e.target.value)}
              style={styles.input}
              min="2000"
              max="2100"
              placeholder="Tahun"
            />
          </div>
        </div>
        
        <div style={{ ...styles.filterRow, marginTop: 16 }}>
          <div style={styles.buttonGroup}>
            <button 
              style={{
                ...styles.primaryButton, 
                opacity: loading ? 0.6 : 1, 
                cursor: loading ? 'not-allowed' : 'pointer'
              }} 
              onClick={handleTampilkan}
              disabled={loading}
            >
              {loading ? 'Memuat...' : 'Tampilkan Data'}
            </button>
            
            <button 
              style={styles.cancelButton}
              onClick={handleReset}
              disabled={loading}
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorText}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={styles.tableCard}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>No</th>
                <th style={styles.th}>Nama Siswa</th>
                <th style={styles.th}>Kelas</th>
                <th style={styles.th}>Target (Rp)</th>
                <th style={styles.th}>Total Bayar (Rp)</th>
                <th style={styles.th}>Sisa (Rp)</th>
                <th style={styles.th}>Status Kenaikan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={styles.loadingText}>
                    Sedang memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.emptyCell}>
                    {error ? 'Gagal memuat data' : 'Tidak ada data. Silakan klik "Tampilkan Data" untuk menampilkan laporan.'}
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{row.nama || '-'}</td>
                    <td style={styles.td}>{row.kelas || '-'}</td>
                    <td style={styles.td}>{row.target || '0'}</td>
                    <td style={styles.td}>{row.totalBayar || '0'}</td>
                    <td style={styles.td}>{row.sisa || '0'}</td>
                    <td style={styles.td}>
                      <span style={getStatusStyle(row.status)}>
                        {row.status || 'Belum Ada Tagihan'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      {data.length > 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: 16, 
          color: '#666', 
          fontSize: 12 
        }}>
          Menampilkan {data.length} siswa
        </div>
      )}
    </div>
  );
}