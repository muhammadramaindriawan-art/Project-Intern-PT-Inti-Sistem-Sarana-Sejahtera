import React, { useState } from 'react';

const styles = {
  container: {
    padding: '32px 24px',
    background: '#f8fafc',
    minHeight: '100vh',
    margin: 0,
    boxSizing: 'border-box',
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    background: 'linear-gradient(135deg, #87CEEB 0%, #b0e0e6 100%)',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '20px 24px',
    marginBottom: 24,
    border: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a202c',
    letterSpacing: '-0.5px',
    margin: 0
  },
  version: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#64748b',
    margin: 0
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '24px',
    marginBottom: 24
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column'
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0'
  },
  filterCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '24px',
    marginBottom: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0'
  },
  filterRow: {
    display: 'grid',
    gridTemplateColumns: '150px 200px 250px 120px',
    gap: '16px',
    alignItems: 'end',
    marginBottom: '16px'
  },
  filterRowWithSearch: {
    display: 'grid',
    gridTemplateColumns: '1fr 200px',
    gap: '16px',
    alignItems: 'end'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    color: '#374151',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease'
  },
  button: {
    padding: '12px 24px',
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  feeSection: {
    marginBottom: '20px'
  },
  feeLabel: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a202c',
    marginBottom: '12px'
  },
  formRow: {
    marginBottom: '16px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    flexWrap: 'wrap'
  },
  postingButton: {
    padding: '10px 20px',
    background: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  cancelButton: {
    padding: '10px 20px',
    background: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  exitButton: {
    padding: '10px 20px',
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px'
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer'
  },
  tableCard: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  tableHeader: {
    padding: '16px 20px',
    borderBottom: '2px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc'
  },
  selectAllContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  tableWrapper: {
    overflowX: 'auto',
    flex: 1
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  thead: {
    background: '#f8fafc',
    borderBottom: '2px solid #e2e8f0'
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#374151',
    fontSize: '14px',
    borderBottom: '1px solid #e2e8f0'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '16px',
    color: '#4b5563',
    borderBottom: '1px solid #f1f5f9'
  },
  emptyCell: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9ca3af',
    fontSize: '15px',
    fontStyle: 'italic'
  }
};

export default function TambahTarget() {
  const currentYear = new Date().getFullYear();
  const [tahunDaftar, setTahunDaftar] = useState(currentYear);
  const [kelas, setKelas] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [cariSiswa, setCariSiswa] = useState('');
  const [biaya, setBiaya] = useState('');
  const [nilai, setNilai] = useState('');
  const [semester, setSemester] = useState('0');
  const [jatuhTempo, setJatuhTempo] = useState('');
  const [data, setData] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  // Opsi kelas
  const kelasOptions = [
    { value: '', label: 'Pilih Kelas' },
    { value: '10', label: 'KELAS 10' },
    { value: '11', label: 'KELAS 11' },
    { value: '12', label: 'KELAS 12' }
  ];

  // Opsi jurusan
  const jurusanOptions = [
    { value: '', label: 'Pilih Jurusan' },
    { value: '1', label: 'TEKNIK GRAFIKA' },
    { value: '2', label: 'REKAYASA PERANGKAT LUNAK' }
  ];

  // Helper function untuk mengkonversi kelas_id ke format string
  const getKelasString = (kelasId) => {
    if (typeof kelasId === 'string') {
      if (kelasId === 'X' || kelasId === '10') return '10';
      if (kelasId === 'XI' || kelasId === '11') return '11';
      if (kelasId === 'XII' || kelasId === '12') return '12';
      return kelasId;
    }
    if (typeof kelasId === 'number') {
      return kelasId === 1 ? '10' : kelasId === 2 ? '11' : kelasId === 3 ? '12' : String(kelasId);
    }
    return String(kelasId);
  };

  // Helper function untuk mendapatkan format kelas display
  const getKelasDisplay = (row) => {
    const kelasStr = getKelasString(row.kelas_id);
    const subKelas = row.sub_kelas ? ` ${row.sub_kelas}` : '';
    const jurusan = row.jurusan_id === 1 ? 'TG' : row.jurusan_id === 2 ? 'RPL' : '';
    return `KELAS ${kelasStr}${subKelas}${jurusan ? ' - ' + jurusan : ''}`;
  };

  // Helper function untuk memeriksa apakah siswa cocok dengan filter
  const matchesFilter = (row, filterKelas, filterJurusan) => {
    if (filterKelas) {
      const kelasStr = getKelasString(row.kelas_id);
      if (kelasStr !== filterKelas) return false;
    }
    if (filterJurusan) {
      if (row.jurusan_id !== parseInt(filterJurusan)) return false;
    }
    return true;
  };

  const handleTampilkan = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/siswa');
      const siswaList = await response.json();
      const siswaData = Array.isArray(siswaList) ? siswaList : siswaList.data || [];

      // Ambil tagihan untuk setiap siswa
      const siswaWithTarget = await Promise.all(
        siswaData.map(async (siswa) => {
          try {
            const siswaId = siswa.id_siswa || siswa.id;
            const tagihanRes = await fetch(`http://localhost:5000/api/tagihan-siswa/${siswaId}`);
            const tagihanData = await tagihanRes.json();
            // Hitung total tagihan belum lunas
            const totalTarget = Array.isArray(tagihanData)
              ? tagihanData.filter(t => t.status !== 'lunas').reduce((sum, t) => sum + (t.nilai || 0), 0)
              : '-';
            return { ...siswa, target_saat_ini: totalTarget };
          } catch {
            return { ...siswa, target_saat_ini: '-' };
          }
        })
      );

      setData(siswaWithTarget);
    } catch (err) {
      alert('Gagal mengambil data siswa');
      setData([]);
    }
  };

  const handleStudentSelect = (studentId, checked) => {
    setSelectedStudents(prev => {
      const newSelected = {
        ...prev,
        [studentId]: checked
      };
      // Update selectAll state based on current selection
      const allSelected = filteredData.length > 0 && 
        filteredData.every(row => {
          const id = row.id_siswa || row.id;
          return newSelected[id] === true;
        });
      setSelectAll(allSelected);
      return newSelected;
    });
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    const newSelected = {};
    if (checked) {
      filteredData.forEach(row => {
        const id = row.id_siswa || row.id;
        newSelected[id] = true;
      });
    }
    setSelectedStudents(newSelected);
  };

  const handlePosting = async () => {
    const selectedIds = Object.keys(selectedStudents).filter(id => selectedStudents[id]);
    if (selectedIds.length === 0) {
      alert('Pilih minimal satu siswa');
      return;
    }

    if (!biaya || !nilai || !jatuhTempo) {
      alert('Mohon lengkapi semua field biaya');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/target/posting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          siswa_ids: selectedIds.map(id => parseInt(id)),
          nama_tagihan: biaya,
          nilai: parseFloat(nilai),
          jatuh_tempo: jatuhTempo,
          semester: semester,
          tahun_biaya: tahunDaftar
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Berhasil membuat tagihan untuk ${result.data.length} siswa!`);
        // Reset form setelah berhasil
        handleBatal();
        // Refresh data siswa untuk menampilkan target terbaru
        handleTampilkan();
      } else {
        alert(`Error: ${result.error || 'Gagal membuat tagihan'}`);
        if (result.errors && result.errors.length > 0) {
          console.error('Errors:', result.errors);
        }
      }
    } catch (err) {
      console.error('Error posting target:', err);
      alert('Gagal menghubungi server. Silakan coba lagi.');
    }
  };

  const handleBatal = () => {
    setBiaya('');
    setNilai('');
    setSemester('0');
    setJatuhTempo('');
    setSelectedStudents({});
    setSelectAll(false);
  };

  // Filter data berdasarkan kelas, jurusan, dan nama
  const filteredData = data
    .filter(row => row.nama && row.nama.trim() !== '')
    .filter(row => matchesFilter(row, kelas, jurusan))
    .filter(row => {
      if (!cariSiswa || cariSiswa.trim() === '') return true;
      return row.nama.toLowerCase().includes(cariSiswa.toLowerCase());
    });

  // Helper function untuk format rupiah
  const formatRupiah = (angka) => {
    if (angka === '-' || angka === undefined || angka === null || isNaN(angka)) return '-';
    return 'Rp ' + Number(angka).toLocaleString('id-ID');
  };

  return (
    <div style={styles.container}>
      {/* Header - ubah seperti InputBantuanSiswa */}
      <div style={{
        ...styles.header,
        background: '#fff',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        marginBottom: 24,
        padding: 24
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '8px',
          color: '#1a202c',
          letterSpacing: '-0.5px'
        }}>
          Tambah Target Tagihan Siswa
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: 500,
          color: '#64748b',
          margin: 0
        }}>
        </div>
      </div>

      {/* Filter Section */}
      <div style={styles.filterCard}>
        <div style={styles.filterRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tahun Daftar</label>
            <input
              type="number"
              value={tahunDaftar}
              onChange={e => setTahunDaftar(e.target.value)}
              style={styles.input}
              min="2020"
              max="2030"
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Kelas</label>
            <select
              value={kelas}
              onChange={e => setKelas(e.target.value)}
              style={styles.input}
            >
              {kelasOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Jurusan</label>
            <select
              value={jurusan}
              onChange={e => setJurusan(e.target.value)}
              style={styles.input}
            >
              {jurusanOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button 
            style={styles.button} 
            onClick={handleTampilkan}
            onMouseOver={e => e.target.style.background = '#1565c0'}
            onMouseOut={e => e.target.style.background = '#1976d2'}
          >
            Tampilkan
          </button>
        </div>
        <div style={styles.filterRowWithSearch}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Cari Siswa</label>
            <input
              type="text"
              value={cariSiswa}
              onChange={e => setCariSiswa(e.target.value)}
              style={styles.input}
              placeholder="Masukkan nama siswa..."
            />
          </div>
        </div>
      </div>

      {/* Main Content: Left Column (Form) + Right Column (Table) */}
      <div style={styles.mainContent}>
        {/* Left Column - Form */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <div style={styles.feeSection}>
              <div style={styles.feeLabel}>Tahun Biaya {tahunDaftar}</div>
              
              <div style={styles.formRow}>
                <label style={styles.label}>Nama Tagihan</label>
                <input
                  type="text"
                  value={biaya}
                  onChange={e => setBiaya(e.target.value)}
                  style={styles.input}
                  placeholder="Contoh: SPP, LKS, Daftar Ulang, dll"
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Nilai</label>
                <input
                  type="number"
                  value={nilai}
                  onChange={e => setNilai(e.target.value)}
                  style={styles.input}
                  placeholder="Nilai"
                  min="0"
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Semester 0</label>
                <input
                  type="number"
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                  style={styles.input}
                  min="0"
                  max="6"
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Jatuh Tempo</label>
                <input
                  type="date"
                  value={jatuhTempo}
                  onChange={e => setJatuhTempo(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.buttonGroup}>
              <button 
                style={styles.postingButton}
                onClick={handlePosting}
                onMouseOver={e => e.target.style.background = '#218838'}
                onMouseOut={e => e.target.style.background = '#28a745'}
              >
                ✓ Posting
              </button>
              <button 
                style={styles.cancelButton}
                onClick={handleBatal}
                onMouseOver={e => e.target.style.background = '#5a6268'}
                onMouseOut={e => e.target.style.background = '#6c757d'}
              >
                Batal
              </button>
            </div>

            {/* Hapus checkbox Posting Iuran Komite dan Posting DU Perkelas */}
            {/* <div style={styles.checkboxGroup}>
              <div style={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={postingIuranKomite}
                  onChange={e => setPostingIuranKomite(e.target.checked)}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Posting Iuran Komite</label>
              </div>
              <div style={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={postingDUPerkelas}
                  onChange={e => setPostingDUPerkelas(e.target.checked)}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Posting DU Perkelas</label>
              </div>
            </div> */}
          </div>
        </div>

        {/* Right Column - Student Table */}
        <div style={styles.rightColumn}>
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <div></div>
              <div style={styles.selectAllContainer}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={e => handleSelectAll(e.target.checked)}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Pilih Semua</label>
              </div>
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Nama Siswa</th>
                    <th style={styles.th}>Kelas</th>
                    <th style={styles.th}>Target Saat Ini</th>
                    <th style={styles.th}>Pilih</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={styles.emptyCell}>
                        Data belum tersedia. Silakan klik "Tampilkan" untuk memuat data siswa.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, i) => {
                      const studentId = row.id_siswa || row.id;
                      const isSelected = selectedStudents[studentId] || false;
                      return (
                        <tr key={studentId || i} style={styles.tr}>
                          <td style={styles.td}>{row.nama}</td>
                          <td style={styles.td}>{getKelasDisplay(row)}</td>
                          <td style={styles.td}>{formatRupiah(row.target_saat_ini)}</td>
                          <td style={styles.td}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => handleStudentSelect(studentId, e.target.checked)}
                              style={styles.checkbox}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        input:focus, select:focus {
          outline: none;
          border-color: #1976d2 !important;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
        }
        tr:hover {
          background: #f8fafc !important;
        }
        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
}

