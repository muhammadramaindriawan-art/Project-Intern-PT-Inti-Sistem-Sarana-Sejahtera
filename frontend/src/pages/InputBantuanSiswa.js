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
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: 24,
    marginBottom: 24,
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
    color: '#1a202c',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#64748b',
    margin: 0
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '28px',
    marginBottom: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0'
  },
  filterRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    alignItems: 'end',
    marginBottom: '20px'
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
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '8px'
  },
  primaryButton: {
    padding: '12px 24px',
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px'
  },
  secondaryButton: {
    padding: '12px 24px',
    background: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px'
  },
  dangerButton: {
    padding: '12px 24px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px'
  },
  searchRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
    alignItems: 'end'
  },
  tableCard: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    border: '1px solid #e2e8f0'
  },
  tableWrapper: {
    overflowX: 'auto'
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
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  }
};

export default function InputBantuanSiswa() {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [jenisBantuan, setJenisBantuan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [cariNama, setCariNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [data, setData] = useState([]);
  const [jumlahBantuan, setJumlahBantuan] = useState({});
  const [selectedStudents, setSelectedStudents] = useState({});
  const [biayaTransaksi, setBiayaTransaksi] = useState('');
  const [saving, setSaving] = useState(false);

  // Opsi jenis bantuan
  const jenisBantuanOptions = [
    { value: '', label: 'Pilih Jenis Bantuan' },
    { value: 'KIP', label: 'KIP' },
    { value: 'GNOTA', label: 'GNOTA' },
    { value: 'BKSM', label: 'BKSM' }
  ];

  // Opsi kelas sama seperti di laporan kenaikan kelas
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

  // Helper function untuk mengkonversi kelas_id ke format string
  const getKelasString = (kelasId) => {
    if (typeof kelasId === 'string') {
      // Jika sudah string, cek apakah sudah dalam format X/XI/XII
      if (kelasId === 'X' || kelasId === 'XI' || kelasId === 'XII') {
        return kelasId;
      }
      // Jika string angka, konversi
      const num = parseInt(kelasId);
      return num === 1 ? 'X' : num === 2 ? 'XI' : num === 3 ? 'XII' : kelasId;
    }
    // Jika number
    return kelasId === 1 ? 'X' : kelasId === 2 ? 'XI' : kelasId === 3 ? 'XII' : String(kelasId);
  };

  // Helper function untuk mendapatkan format kelas display
  const getKelasDisplay = (row) => {
    const kelasStr = getKelasString(row.kelas_id);
    const subKelas = row.sub_kelas ? ` ${row.sub_kelas}` : '';
    const jurusan = row.jurusan_id === 1 ? 'TG' : row.jurusan_id === 2 ? 'RPL' : '';
    return `${kelasStr}${subKelas}${jurusan ? ' - ' + jurusan : ''}`;
  };

  // Helper function untuk memeriksa apakah siswa cocok dengan filter kelas
  const matchesKelasFilter = (row, filterKelas) => {
    if (!filterKelas || filterKelas === '') return true;

    const kelasStr = getKelasString(row.kelas_id);
    
    // Filter untuk semua kelas (X, XI, XII) tanpa spesifikasi jurusan
    if (filterKelas === 'X' || filterKelas === 'XI' || filterKelas === 'XII') {
      return kelasStr === filterKelas;
    }

    // Filter untuk kelas dengan jurusan spesifik (X-TG, X-RPL, dll)
    if (filterKelas.includes('-')) {
      const [filterKelasStr, filterJurusan] = filterKelas.split('-');
      if (kelasStr !== filterKelasStr) return false;
      
      // Map jurusan: TG = 1, RPL = 2
      const jurusanId = filterJurusan === 'TG' ? 1 : filterJurusan === 'RPL' ? 2 : null;
      return jurusanId && row.jurusan_id === jurusanId;
    }

    return false;
  };

  const handleTampilkan = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/siswa');
      const siswa = await response.json();
      // Jika respons { data: [...] }
      setData(Array.isArray(siswa) ? siswa : siswa.data || []);
    } catch (err) {
      alert('Gagal mengambil data siswa');
      setData([]);
    }
  };

  const handleReset = () => {
    setTahun(new Date().getFullYear());
    setJenisBantuan('');
    setTanggal('');
    setCariNama('');
    setKelas('');
    setData([]);
    setSelectedStudents({});
    setJumlahBantuan({});
    setBiayaTransaksi('');
  };

  const handleStudentSelect = (studentId, checked) => {
    setSelectedStudents(prev => ({
      ...prev,
      [studentId]: checked
    }));
  };

  const handleSimpan = async () => {
    if (!tanggal) {
      alert('Tanggal harus diisi');
      return;
    }
    if (!jenisBantuan) {
      alert('Jenis bantuan harus dipilih');
      return;
    }
    
    const selectedIds = Object.keys(selectedStudents).filter(id => selectedStudents[id]);
    if (selectedIds.length === 0) {
      alert('Pilih minimal satu siswa');
      return;
    }

    const jumlahBantuanFilter = jumlahBantuan['filter'] || '';
    if (!jumlahBantuanFilter || parseFloat(jumlahBantuanFilter) <= 0) {
      alert('Jumlah bantuan harus diisi dan lebih dari 0');
      return;
    }

    // Siapkan data untuk dikirim
    const dataToSave = selectedIds.map(studentId => {
      const student = data.find(s => String(s.id_siswa) === String(studentId));
      if (!student) return null;
      return {
        id_siswa: student.id_siswa,
        jenis_bantuan: jenisBantuan,
        jumlah: parseFloat(jumlahBantuanFilter),
        tanggal: tanggal,
        tahun: parseInt(tahun) || new Date().getFullYear(),
        biaya_transaksi: biayaTransaksi ? parseFloat(biayaTransaksi) : null
      };
    }).filter(item => item !== null);

    if (dataToSave.length === 0) {
      alert('Tidak ada data yang valid untuk disimpan');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/bantuan-siswa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data_bantuan: dataToSave })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Berhasil menyimpan ${result.data.length} data bantuan siswa`);
        // Reset form setelah berhasil
        handleReset();
      } else {
        alert(result.error || 'Gagal menyimpan data bantuan');
      }
    } catch (err) {
      console.error('Error saving bantuan:', err);
      alert('Gagal menyimpan data bantuan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  // Filter data berdasarkan kelas dan nama
  const filteredData = data
    .filter(row => row.nama && row.nama.trim() !== '') // hanya siswa yang punya nama
    .filter(row => matchesKelasFilter(row, kelas))
    .filter(row => {
      if (!cariNama || cariNama.trim() === '') return true;
      return row.nama.toLowerCase().includes(cariNama.toLowerCase());
    });

  // Gabungkan input cari nama siswa ke atas tabel
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>Input Penerima Bantuan</div>
      </div>

      {/* Form Section */}
      <form
        style={{
          ...styles.card,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          alignItems: 'end',
          marginBottom: 24
        }}
        onSubmit={e => {
          e.preventDefault();
          handleSimpan();
        }}
      >
        <div style={styles.inputGroup}>
          <label style={styles.label}>Tahun Daftar</label>
          <input
            type="number"
            value={tahun}
            onChange={e => setTahun(e.target.value)}
            style={styles.input}
            min="2020"
            max="2030"
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Jenis Bantuan</label>
          <select
            value={jenisBantuan}
            onChange={e => setJenisBantuan(e.target.value)}
            style={styles.input}
            required
          >
            {jenisBantuanOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Tanggal Diterima</label>
          <input
            type="date"
            value={tanggal}
            onChange={e => setTanggal(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Jumlah Bantuan (Rp)</label>
          <input
            type="number"
            min="0"
            placeholder="Rp"
            value={jumlahBantuan['filter'] || ''}
            onChange={e => setJumlahBantuan(prev => ({ ...prev, filter: e.target.value }))}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.buttonGroup}>
          <button 
            type="submit"
            style={{...styles.primaryButton, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer'}}
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button 
            type="button"
            style={styles.secondaryButton}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </form>

      {/* Table Section dengan filter nama di atas tabel */}
      <div style={styles.tableCard}>
        <div style={{ padding: '20px 20px 0 20px' }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Cari Nama Siswa</label>
            <input
              type="text"
              value={cariNama}
              onChange={e => setCariNama(e.target.value)}
              style={styles.input}
              placeholder="Masukkan nama siswa..."
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Filter Kelas</label>
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
          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={handleTampilkan}
            >
              Tampilkan Data
            </button>
          </div>
        </div>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={{...styles.th, width: '60px'}}>No</th>
                <th style={styles.th}>Nama Siswa</th>
                <th style={{...styles.th, width: '140px'}}>Kelas</th>
                <th style={{...styles.th, width: '80px'}}>Pilih</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} style={styles.emptyCell}>
                    Data belum tersedia. Silakan klik "Tampilkan Data" untuk memuat data siswa.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => (
                  <tr key={row.id_siswa || row.id || i} style={styles.tr}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>{row.nama}</td>
                    <td style={styles.td}>{getKelasDisplay(row)}</td>
                    <td style={styles.td}>
                      <input 
                        type="checkbox" 
                        style={styles.checkbox}
                        checked={selectedStudents[row.id_siswa || row.id] || false}
                        onChange={e => handleStudentSelect(row.id_siswa || row.id, e.target.checked)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
        .table-row:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}