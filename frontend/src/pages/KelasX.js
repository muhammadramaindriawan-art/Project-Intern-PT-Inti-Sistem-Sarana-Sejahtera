import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

// ============================================================================
// CONSTANTS
// ============================================================================
const SUB_KELAS = ['1', '2'];
const API_BASE_URL = 'http://localhost:5000/api';

const JURUSAN_LIST = [
  { id: 1, kode: 'TG', label: 'Teknik Grafika' },
  { id: 2, kode: 'RPL', label: 'Rekayasa Perangkat Lunak' }
];

// ============================================================================
// STYLES
// ============================================================================
const styles = {
  container: { 
    maxWidth: 1200, 
    margin: '0 auto', 
    padding: '24px 16px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#2D3748',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  header: { 
    fontWeight: 700, 
    fontSize: '28px', 
    marginBottom: '24px',
    color: '#1A202C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  actionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    minWidth: '150px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonPrimary: {
    backgroundColor: '#3182ce',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
    color: '#718096',
    cursor: 'not-allowed'
  },
  jurusanContainer: {
    marginBottom: '24px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  jurusanHeader: {
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  jurusanTitle: { 
    fontSize: '18px', 
    fontWeight: 600,
    margin: 0
  },
  badge: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 500
  },
  filterContainer: {
    padding: '16px 20px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#4a5568',
    minWidth: '80px'
  },
  filterInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    width: '300px',
    transition: 'all 0.2s',
    outline: 'none'
  },
  filterInputFocus: {
    borderColor: '#4299e1',
    boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)'
  },
  subKelasHeader: {
    padding: '12px 20px',
    backgroundColor: '#edf2f7',
    borderBottom: '1px solid #e2e8f0',
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tableContainer: { 
    overflow: 'hidden'
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  tableHeader: { 
    padding: '12px 16px', 
    textAlign: 'left', 
    fontWeight: 600, 
    color: '#4a5568', 
    background: '#f7fafc',
    borderBottom: '2px solid #e2e8f0',
    fontSize: '13px'
  },
  tableCell: { 
    padding: '12px 16px', 
    borderBottom: '1px solid #edf2f7'
  },
  tableCellCenter: { 
    padding: '12px 16px', 
    textAlign: 'center',
    borderBottom: '1px solid #edf2f7'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer'
  },
  statusActive: {
    color: '#38a169',
    fontWeight: 500,
    background: '#f0fff4',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    display: 'inline-block'
  },
  statusInactive: {
    color: '#e53e3e',
    fontWeight: 500,
    background: '#fff5f5',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    display: 'inline-block'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#a0aec0',
    fontStyle: 'italic'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  },
  loadingSpinner: {
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #3182ce',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    animation: 'spin 1s linear infinite'
  },
  selectedCount: {
    fontSize: '14px',
    color: '#4a5568',
    fontWeight: 500
  }
};

// ============================================================================
// COMPONENT
// ============================================================================
const KelasX = () => {
  // State Management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterNama, setFilterNama] = useState({ 1: '', 2: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [inputFocus, setInputFocus] = useState({ 1: false, 2: false });
  const [subKelasBaru, setSubKelasBaru] = useState('');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  useEffect(() => {
    fetchSiswaData();
  }, []);

  const fetchSiswaData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/siswa`);
      const result = await response.json();
      
      const filteredData = result.filter(
        row => row.kelas_id === 1 && (row.jurusan_id === 1 || row.jurusan_id === 2)
      );
      
      setData(filteredData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleFilterNamaChange = (jurusanId, value) => {
    setFilterNama(prev => ({ ...prev, [jurusanId]: value }));
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (jurusanId, subKelas) => {
    const siswaInSubKelas = data
      .filter(row => row.jurusan_id === jurusanId && String(row.sub_kelas) === subKelas)
      .map(siswa => siswa.id_siswa);
    
    const allSelected = siswaInSubKelas.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !siswaInSubKelas.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...siswaInSubKelas])]);
    }
  };

  const handleNaikKelas = async () => {
    if (selectedIds.length === 0 || !subKelasBaru) return;
    
    try {
      await fetch(`${API_BASE_URL}/siswa/naik-kelas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          kelas_id_baru: 2,
          sub_kelas_baru: subKelasBaru
        })
      });
      
      // Reset state
      setSelectedIds([]);
      setSubKelasBaru('');
      
      // Refresh data
      await fetchSiswaData();
    } catch (error) {
      console.error('Error promoting students:', error);
    }
  };

  const handleExportExcel = (jurusan, sub) => {
    const siswaList = getFilteredSiswa(jurusan.id, sub, filterNama[jurusan.id] || '');
    
    const exportData = siswaList.map((siswa, idx) => ({
      No: idx + 1,
      Nama: siswa.nama,
      Status: siswa.status === 1 ? 'Aktif' : 'Tidak Aktif'
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Absensi X ${jurusan.kode} ${sub}`);
    XLSX.writeFile(wb, `Absensi_X_${jurusan.kode}_${sub}.xlsx`);
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  const getFilteredSiswa = (jurusanId, subKelas, namaFilter) => {
    return data.filter(
      row =>
        row.jurusan_id === jurusanId &&
        String(row.sub_kelas) === subKelas &&
        row.nama.toLowerCase().includes(namaFilter.toLowerCase())
    );
  };


  const isAllSelected = (siswaList) => {
    return siswaList.length > 0 && 
      siswaList.every(siswa => selectedIds.includes(siswa.id_siswa));
  };

  // ============================================================================
  // RENDER COMPONENTS
  // ============================================================================
  const renderHeader = () => (
    <div style={styles.header}>
      <span>Pembagian Kelas X</span>
      {selectedIds.length > 0 && (
        <span style={styles.selectedCount}>
          {selectedIds.length} siswa terpilih
        </span>
      )}
    </div>
  );

  const renderActionContainer = () => (
    <div style={styles.actionContainer}>
      <select 
        value={subKelasBaru} 
        onChange={e => setSubKelasBaru(e.target.value)} 
        style={styles.select}
      >
        <option value="">Pilih Sub Kelas Tujuan</option>
        <option value="1">XI - 1</option>
        <option value="2">XI - 2</option>
      </select>
      <button
        onClick={handleNaikKelas}
        disabled={selectedIds.length === 0 || !subKelasBaru}
        style={{
          ...styles.button,
          ...(selectedIds.length === 0 || !subKelasBaru 
            ? styles.buttonDisabled 
            : styles.buttonPrimary)
        }}
      >
        Naik ke Kelas XI ({selectedIds.length})
      </button>
    </div>
  );

  const renderJurusanHeader = (jurusan) => {
    // Hitung total siswa per jurusan untuk sub kelas 1 dan 2 yang tampil di tabel
    const totalSub1 = getFilteredSiswa(jurusan.id, '1', '').length;
    const totalSub2 = getFilteredSiswa(jurusan.id, '2', '').length;
    const totalSiswaJurusan = totalSub1 + totalSub2;

    return (
      <div style={styles.jurusanHeader}>
        <h2 style={styles.jurusanTitle}>
          {jurusan.label} (X {jurusan.kode})
        </h2>
        <div style={styles.badge}>
          {totalSiswaJurusan} Siswa
        </div>
      </div>
    );
  };

  const renderFilterContainer = (jurusan) => {
    const filterValue = filterNama[jurusan.id] || '';
    
    return (
      <div style={styles.filterContainer}>
        <span style={styles.filterLabel}>Cari Siswa:</span>
        <input
          type="text"
          placeholder={`Cari nama siswa di ${jurusan.label}...`}
          value={filterValue}
          onChange={e => handleFilterNamaChange(jurusan.id, e.target.value)}
          onFocus={() => setInputFocus(prev => ({ ...prev, [jurusan.id]: true }))}
          onBlur={() => setInputFocus(prev => ({ ...prev, [jurusan.id]: false }))}
          style={{
            ...styles.filterInput,
            ...(inputFocus[jurusan.id] ? styles.filterInputFocus : {})
          }}
        />
      </div>
    );
  };

  const renderSubKelasHeader = (jurusan, sub, siswaCount) => (
    <div style={styles.subKelasHeader}>
      <div>
        Kelas X {jurusan.kode} {sub}
        <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 'normal' }}>
          ({siswaCount} siswa)
        </span>
      </div>
      <button
        onClick={() => handleExportExcel(jurusan, sub)}
        style={{
          ...styles.button,
          ...styles.buttonPrimary
        }}
      >
        Export Absensi Excel
      </button>
    </div>
  );

  const renderTableHeader = (allSelected, jurusanId, subKelas) => (
    <thead>
      <tr>
        <th style={{ ...styles.tableHeader, width: '50px' }}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => handleSelectAll(jurusanId, subKelas)}
            style={styles.checkbox}
          />
        </th>
        <th style={{ ...styles.tableHeader, width: '60px' }}>No</th>
        <th style={styles.tableHeader}>Nama Siswa</th>
        <th style={{ ...styles.tableHeader, width: '100px', textAlign: 'center' }}>
          Status
        </th>
      </tr>
    </thead>
  );

  const renderTableRow = (siswa, index) => (
    <tr key={siswa.id_siswa}>
      <td style={styles.tableCellCenter}>
        <input
          type="checkbox"
          checked={selectedIds.includes(siswa.id_siswa)}
          onChange={() => handleSelect(siswa.id_siswa)}
          style={styles.checkbox}
        />
      </td>
      <td style={styles.tableCellCenter}>{index + 1}</td>
      <td style={styles.tableCell}>{siswa.nama}</td>
      <td style={styles.tableCellCenter}>
        <span style={siswa.status === 1 ? styles.statusActive : styles.statusInactive}>
          {siswa.status === 1 ? 'Aktif' : 'Tidak Aktif'}
        </span>
      </td>
    </tr>
  );

  const renderEmptyState = (filterValue) => (
    <tr>
      <td colSpan={4} style={styles.emptyState}>
        {filterValue 
          ? 'Tidak ada siswa yang sesuai dengan pencarian' 
          : 'Tidak ada siswa dalam kelas ini'}
      </td>
    </tr>
  );

  const renderSubKelas = (jurusan, sub) => {
    const filterValue = filterNama[jurusan.id] || '';
    const siswaList = getFilteredSiswa(jurusan.id, sub, filterValue);
    const allSelected = isAllSelected(siswaList);
    
    return (
      <div key={sub}>
        {renderSubKelasHeader(jurusan, sub, siswaList.length)}
        
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            {renderTableHeader(allSelected, jurusan.id, sub)}
            <tbody>
              {siswaList.length === 0 
                ? renderEmptyState(filterValue)
                : siswaList.map((siswa, index) => renderTableRow(siswa, index))
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderJurusan = (jurusan) => (
    <div key={jurusan.id} style={styles.jurusanContainer}>
      {renderJurusanHeader(jurusan)}
      {renderFilterContainer(jurusan)}
      {SUB_KELAS.map(sub => renderSubKelas(jurusan, sub))}
    </div>
  );

  const renderLoading = () => (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingSpinner}></div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        tr:hover {
          background-color: #f7fafc;
        }
      `}</style>
      
      {renderHeader()}
      {renderActionContainer()}
      
      {loading ? renderLoading() : JURUSAN_LIST.map(renderJurusan)}
    </div>
  );
};

export default KelasX;