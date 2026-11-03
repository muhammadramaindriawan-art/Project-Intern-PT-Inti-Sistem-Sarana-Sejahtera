import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const TransaksiHarianKasir = () => {
  const [tanggal, setTanggal] = useState('');
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil data pembayaran dan bantuan siswa secara parallel
      const [pembayaranRes, bantuanRes] = await Promise.all([
        fetch('http://localhost:5000/api/pembayaran'),
        fetch('http://localhost:5000/api/bantuan-siswa')
      ]);

      const pembayaranResult = await pembayaranRes.json();
      const bantuanResult = await bantuanRes.json();

      // Format data pembayaran
      const pembayaranData = (pembayaranResult.data || []).map(item => ({
        id: `pembayaran-${item.id}`,
        tanggal: item.tanggal,
        nama_siswa: item.nama_siswa || '-',
        jumlah_bayar: Number(item.jumlah_bayar || 0),
        keterangan: item.status || item.keterangan || 'Pembayaran',
        jenis: 'pembayaran',
        no_dok: '-',
        no_sl: '-',
        no_rekening: '-',
        kelas: item.kelas || '-'
      }));

      // Format data bantuan siswa
      const bantuanData = (bantuanResult.data || []).map(item => ({
        id: `bantuan-${item.id || item.id_bantuan || ''}`,
        tanggal: item.tanggal,
        nama_siswa: item.nama_siswa || '-',
        jumlah_bayar: Number(item.jumlah_bantuan || item.jumlah || 0),
        keterangan: `Bantuan ${item.jenis_bantuan || ''}`,
        jenis: 'bantuan',
        no_dok: '-',
        no_sl: '-',
        no_rekening: '-',
        kelas: item.kelas || '-'
      }));

      // Gabungkan data dan urutkan berdasarkan tanggal
      const combinedData = [...pembayaranData, ...bantuanData].sort((a, b) => {
        const dateA = new Date(a.tanggal);
        const dateB = new Date(b.tanggal);
        return dateB - dateA; // Urutkan dari terbaru ke terlama
      });

      setData(combinedData);
      setFiltered(combinedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setData([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTanggal = (tanggalString) => {
    if (!tanggalString) return '-';
    return tanggalString.slice(0, 10);
  };

  const formatRupiah = (nominal) => {
    const angka = Number(nominal || 0);
    return `Rp ${angka.toLocaleString('id-ID')}`;
  };

  const handleReset = () => {
    setTanggal('');
    setFiltered(data);
  };

  const handleTampilkan = () => {
    if (!tanggal) {
      setFiltered(data);
      return;
    }

    const dataFiltered = data.filter(item => {
      const itemDate = formatTanggal(item.tanggal);
      return itemDate === tanggal;
    });
    setFiltered(dataFiltered);
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) return;

    const exportData = filtered.map((item, idx) => ({
      No: idx + 1,
      Tanggal: formatTanggal(item.tanggal),
      'No. SL': item.no_sl || '-',
      'No Dok': item.no_dok || '-',
      'Nama': item.nama_siswa || '-',
      'Masuk': Number(item.jumlah_bayar || 0),
      'Keluar': 0,
      'No. Rekening': item.no_rekening || '-',
      Keterangan: item.keterangan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
    
    const namaFile = tanggal 
      ? `Transaksi_Harian_${tanggal}.xlsx` 
      : 'Transaksi_Harian.xlsx';
    
    XLSX.writeFile(wb, namaFile);
  };

  const totalTransaksi = filtered.reduce((sum, item) => sum + Number(item.jumlah_bayar || 0), 0);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Laporan Transaksi Per Hari</h1>

      <div style={styles.filterCard}>
        <div style={styles.filterRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tanggal</label>
            <input 
              type="date" 
              value={tanggal} 
              onChange={e => setTanggal(e.target.value)}
              style={styles.input}
            />
          </div>
          
          <div style={styles.buttonGroup}>
            <button 
              onClick={handleReset}
              style={styles.resetButton}
            >
              Reset
            </button>
            <button 
              onClick={handleTampilkan}
              style={styles.primaryButton}
            >
              Tampilkan
            </button>
            <button
              onClick={handleExportExcel}
              style={{
                ...styles.successButton,
                opacity: filtered.length === 0 ? 0.5 : 1,
                cursor: filtered.length === 0 ? 'not-allowed' : 'pointer'
              }}
              disabled={filtered.length === 0}
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {filtered.length > 0 && (
        <div style={styles.summaryCard}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Transaksi:</span>
            <span style={styles.summaryValue}>{filtered.length}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Pembayaran:</span>
            <span style={styles.summaryValue}>{formatRupiah(totalTransaksi)}</span>
          </div>
        </div>
      )}

      <div style={styles.tableCard}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>No.</th>
                <th style={styles.th}>Tanggal</th>
                <th style={styles.th}>Nama</th>
                <th style={styles.th}>Masuk</th>
                <th style={styles.th}>Keluar</th>
                <th style={styles.th}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={styles.emptyCell}>
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={styles.emptyCell}>
                    Tidak ada data transaksi
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id || idx} style={styles.tr}>
                    <td style={styles.td}>{idx + 1}</td>
                    <td style={styles.td}>{formatTanggal(item.tanggal)}</td>
                    <td style={styles.td}>{item.nama_siswa || '-'}</td>
                    <td style={styles.td}>
                      {item.jenis === 'bantuan' || item.jenis === 'pembayaran' 
                        ? formatRupiah(item.jumlah_bayar) 
                        : '-'}
                    </td>
                    <td style={styles.td}>-</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: (item.keterangan?.toLowerCase().includes('sukses') || item.keterangan?.toLowerCase().includes('lunas'))
                          ? '#d4edda'
                          : (item.jenis === 'bantuan' ? '#dbeafe' : '#fff3cd'),
                        color: (item.keterangan?.toLowerCase().includes('sukses') || item.keterangan?.toLowerCase().includes('lunas'))
                          ? '#155724'
                          : (item.jenis === 'bantuan' ? '#1e40af' : '#856404')
                      }}>
                        {(item.keterangan?.toLowerCase().includes('sukses') || item.keterangan?.toLowerCase().includes('lunas'))
                          ? 'Sukses'
                          : item.keterangan || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

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
  resetButton: {
    padding: '12px 24px',
    background: '#f7fafc',
    color: '#4a5568',
    border: '1px solid #cbd5e0',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  primaryButton: {
    padding: '12px 24px',
    background: '#4299e1',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  successButton: {
    padding: '12px 24px',
    background: '#48bb78',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  summaryCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    gap: 32,
    flexWrap: 'wrap'
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  summaryLabel: {
    fontSize: 13,
    color: '#718096',
    fontWeight: 500
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#2d3748'
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
    fontSize: 14
  },
  tr: {
    borderBottom: '1px solid #f1f3f5',
    transition: 'background 0.2s'
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
  statusBadge: {
    padding: '4px 12px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block'
  }
};

export default TransaksiHarianKasir;