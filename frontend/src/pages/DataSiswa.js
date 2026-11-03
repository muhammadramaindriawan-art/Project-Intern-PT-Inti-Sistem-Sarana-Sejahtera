import React, { useState, useEffect } from 'react';

// Constants
const SISWA_BARU_TIMEOUT = 5000; // 5 detik

// Styling Constants
const styles = {
  container: { maxWidth: 1400, margin: '0 auto', padding: '20px' },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  title: { fontWeight: 700, fontSize: 28, marginBottom: 4 },
  subtitle: { color: '#666', fontWeight: 500, fontSize: 16 },
  filterContainer: { 
    background: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    marginBottom: 24, 
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' 
  },
  filterTitle: { fontWeight: 600, fontSize: 16, marginBottom: 16, color: '#333' },
  filterGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
    gap: 16 
  },
  input: { 
    padding: 12, 
    borderRadius: 8, 
    border: '1px solid #e1e5e9', 
    fontSize: 14, 
    outline: 'none' 
  },
  tableContainer: { 
    background: '#fff', 
    borderRadius: 12, 
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
    padding: 0, 
    overflow: 'hidden' 
  },
  tableHeader: { 
    padding: 16, 
    textAlign: 'left', 
    fontWeight: 600, 
    color: '#333',
    background: '#f8f9fa' 
  },
  tableCell: { padding: 16 },
  tableCellCenter: { padding: 16, textAlign: 'center' },
  detailButton: { 
    background: '#4ea8de', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '6px', 
    padding: '8px 12px', 
    fontWeight: '500', 
    fontSize: '12px', 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    margin: '0 auto'
  },
  newBadge: {
    marginLeft: '8px', 
    background: '#10b981', 
    color: 'white', 
    padding: '2px 6px', 
    borderRadius: '4px', 
    fontSize: '10px' 
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

const StatusLabel = ({ status }) => {
  if (status === 1) return <span style={{ color: '#10b981', fontWeight: '600' }}>Aktif</span>;
  if (status === 0) return <span style={{ color: '#ef4444', fontWeight: '600' }}>Tidak Aktif</span>;
  return <span style={{ color: '#f59e0b', fontWeight: '600' }}>Status Tidak Diketahui</span>;
};

const JurusanLabel = ({ jurusanId }) => {
  if (jurusanId === 1) return 'TG';
  if (jurusanId === 2) return 'RPL';
  return '-';
};

const KelasLabel = ({ kelasId }) => {
  if (kelasId === 1) return 'X';
  if (kelasId === 2) return 'XI';
  if (kelasId === 3) return 'XII';
  return '-';
};

const NewStudentBadge = () => (
  <span style={styles.newBadge}>Baru</span>
);

// Main Component
const DataSiswa = ({ onDetailClick }) => {
  const [data, setData] = useState([]);
  const [filterNama, setFilterNama] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [newSiswaIds, setNewSiswaIds] = useState([]);

  // Tambahan state
  const [selectedIds, setSelectedIds] = useState([]);
  const [moveKelas, setMoveKelas] = useState('');
  const [moveJurusan, setMoveJurusan] = useState('');
  const [moveSubKelas, setMoveSubKelas] = useState('');

  // Tambahkan state untuk notifikasi
  const [notif, setNotif] = useState('');

  const handleDetail = (id) => {
    if (typeof onDetailClick === 'function') {
      onDetailClick(id);
    } else {
      alert('Fungsi navigasi ke halaman detail belum tersedia');
    }
  };

  const fetchData = React.useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/siswa');
      if (!response.ok) throw new Error('Gagal mengambil data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handleReceiveFromCalonSiswa = React.useCallback(async (siswaId) => {
    try {
      setLoading(true);
      await fetchData();
      if (siswaId) {
        setNewSiswaIds(prev => [...prev, siswaId]);
        setTimeout(() => {
          setNewSiswaIds(prev => prev.filter(id => id !== siswaId));
        }, SISWA_BARU_TIMEOUT);
      }
      console.log('Data berhasil diterima dari calon siswa!');
    } catch (error) {
      console.error('Error receiving data from calon siswa:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    window.refreshDataSiswa = handleReceiveFromCalonSiswa;
    return () => {
      window.refreshDataSiswa = null;
    };
  }, [fetchData, handleReceiveFromCalonSiswa]);

  const filteredData = data.filter((row) => {
    const matchNama = row.nama?.toLowerCase().includes(filterNama.toLowerCase());
    const matchKelas = filterKelas ? String(row.kelas_id) === filterKelas : true;
    const matchJurusan = filterJurusan ? String(row.jurusan_id) === filterJurusan : true;
    const matchStatus = filterStatus ? String(row.status) === filterStatus : true;
    
    return matchNama && matchKelas && matchJurusan && matchStatus;
  });

  // Fungsi handle checkbox
  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Fungsi bulk move
  const handleBulkMove = async () => {
    if (!moveKelas || !moveJurusan || !moveSubKelas || selectedIds.length === 0) return;
    try {
      const payload = {
        ids: selectedIds,
        kelas_id: parseInt(moveKelas),
        jurusan_id: parseInt(moveJurusan),
        sub_kelas: parseInt(moveSubKelas) // pastikan integer!
      };
      // Kirim kelas_id dan jurusan_id sebagai string (bukan integer) agar sesuai dengan backend yang menyimpan kelas_id sebagai VARCHAR
      console.log('Sending bulk update:', payload);

      const res = await fetch('http://localhost:5000/api/siswa/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      console.log('Backend response:', result);

      if (result.success) {
        setNotif(`Berhasil memindahkan ${selectedIds.length} siswa ke kelas baru.`);
        setSelectedIds([]);
        setMoveKelas('');
        setMoveJurusan('');
        setMoveSubKelas('');
        fetchData(); // refresh data
      } else {
        setNotif('Gagal memindahkan siswa: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error bulk move:', err);
      setNotif('Terjadi kesalahan saat memindahkan siswa: ' + err.message);
    }
    setTimeout(() => setNotif(''), 4000);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={styles.container}>
      {/* Notifikasi */}
      {notif && (
        <div style={{
          background: '#e0f7fa',
          color: '#00796b',
          padding: '12px 20px',
          borderRadius: 8,
          marginBottom: 16,
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          {notif}
        </div>
      )}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Data Siswa</div>
          <div style={styles.subtitle}>Data Siswa SMK Palapa</div>
        </div>
      </div>
      
      {/* Filter Section */}
      <div style={styles.filterContainer}>
        <div style={styles.filterTitle}>Filter Data</div>
        <div style={styles.filterGrid}>
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={filterNama}
            onChange={e => setFilterNama(e.target.value)}
            style={styles.input}
          />
          
<select 
  value={filterKelas} 
  onChange={e => setFilterKelas(e.target.value)} 
  style={styles.input}
>
  <option value="">Semua Kelas</option>
  <option value="X">X</option>
  <option value="XI">XI</option>
  <option value="XII">XII</option>
</select>
          
          <select 
            value={filterJurusan} 
            onChange={e => setFilterJurusan(e.target.value)} 
            style={styles.input}
          >
            <option value="">Semua Jurusan</option>
            <option value="1">TG</option>
            <option value="2">RPL</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)} 
            style={styles.input}
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* Bulk Move Section */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <select value={moveKelas} onChange={e => setMoveKelas(e.target.value)} style={styles.input}>
          <option value="">Pilih Kelas</option>
          <option value="1">X</option>
          <option value="2">XI</option>
          <option value="3">XII</option>
        </select>
        <select value={moveJurusan} onChange={e => setMoveJurusan(e.target.value)} style={styles.input}>
          <option value="">Pilih Jurusan</option>
          <option value="1">TG</option>
          <option value="2">RPL</option>
        </select>
        <select value={moveSubKelas} onChange={e => setMoveSubKelas(e.target.value)} style={styles.input}>
          <option value="">Sub Kelas</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
        <button 
          onClick={handleBulkMove} 
          disabled={selectedIds.length === 0 || !moveKelas || !moveJurusan || !moveSubKelas}
          style={{
            ...styles.detailButton,
            opacity: selectedIds.length === 0 || !moveKelas || !moveJurusan || !moveSubKelas ? 0.6 : 1,
            cursor: selectedIds.length === 0 || !moveKelas || !moveJurusan || !moveSubKelas ? 'not-allowed' : 'pointer'
          }}
        >
          Pindahkan
        </button>
      </div>

      {/* Table Section */}
      <div style={styles.tableContainer}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={styles.tableHeader}>Pilih</th>
              <th style={styles.tableHeader}>Nama</th>
              <th style={{ ...styles.tableHeader, textAlign: 'center' }}>Kelas</th>
              <th style={styles.tableHeader}>Jurusan</th>
              <th style={styles.tableHeader}>Status</th>
              <th style={{ ...styles.tableHeader, textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#666' }}>
                  {data.length === 0 ? 'Tidak ada data siswa' : 'Tidak ada data yang sesuai dengan filter'}
                </td>
              </tr>
            )}
            {filteredData.map(row => (
              <tr 
                key={row.id_siswa} 
                style={{ 
                  borderBottom: '1px solid #f1f3f4',
                  background: newSiswaIds.includes(row.id_siswa) ? '#e6fffa' : 'transparent',
                  transition: 'background-color 0.5s ease'
                }}
              >
                <td style={styles.tableCellCenter}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(row.id_siswa)} 
                    onChange={() => handleSelect(row.id_siswa)} 
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={styles.tableCell}>
                  {row.nama}
                  {newSiswaIds.includes(row.id_siswa) && <NewStudentBadge />}
                </td>
                <td style={styles.tableCellCenter}>
                  <KelasLabel kelasId={row.kelas_id} />
                </td>
                <td style={styles.tableCell}>
                  <JurusanLabel jurusanId={row.jurusan_id} />
                </td>
                <td style={styles.tableCell}>
                  <StatusLabel status={row.status} />
                </td>
                <td style={styles.tableCellCenter}>
                  <button
                    onClick={() => handleDetail(row.id_siswa)}
                    style={styles.detailButton}
                    title="Lihat Detail"
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataSiswa;