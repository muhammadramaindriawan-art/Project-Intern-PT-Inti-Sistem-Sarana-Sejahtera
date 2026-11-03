import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const LaporanSiswaPerKelas = () => {
  const [dataSiswa, setDataSiswa] = useState([]);
  const [statistik, setStatistik] = useState({
    siswaLaki: 0,
    siswaPerempuan: 0,
    totalSiswa: 0
  });
  const [filter, setFilter] = useState({
    tahun_daftar: new Date().getFullYear(),
    jurusan_id: '',
    kelas: '',
    filter_nama: ''
  });
  const [loading, setLoading] = useState(false);

  const jurusanOptions = [
    { value: '', label: 'Semua Jurusan' },
    { value: '1', label: 'TG' },
    { value: '2', label: 'RPL' }
  ];

  const kelasOptions = [
    { value: '', label: 'Semua Kelas' },
    { value: '1', label: 'X 1' },
    { value: '2', label: 'X 2' },
    { value: '3', label: 'XI 1' },
    { value: '4', label: 'XI 2' },
    { value: '5', label: 'XII 1' },
    { value: '6', label: 'XII 2' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filter.tahun_daftar) queryParams.append('tahun_daftar', filter.tahun_daftar);
      if (filter.jurusan_id) queryParams.append('jurusan_id', filter.jurusan_id);
      if (filter.kelas) queryParams.append('kelas', filter.kelas);
      if (filter.filter_nama) queryParams.append('filter_nama', filter.filter_nama);

      const response = await fetch(`http://localhost:5000/api/laporan-siswa?${queryParams}`);
      const result = await response.json();

      const mapKelasNumberToRoman = (n) => {
        if (typeof n === 'number' || /^\d+$/.test(String(n))) {
          const num = Number(n);
          return num === 1 ? 'X' : num === 2 ? 'XI' : num === 3 ? 'XII' : String(n);
        }
        return n;
      };

      const normalizeSiswa = (s) => {
        const id = s.id_siswa ?? s.id ?? s._id;
        const nama = s.nama || s.nama_lengkap || `${s.nama_depan || ''} ${s.nama_belakang || ''}`.trim() || '-';
        const alamat = s.alamat ?? s.alamat_rumah ?? s.address ?? '-';
        const kelasRaw = s.kelas_id ?? s.kelas ?? s.kelasId;
        const subRaw = s.sub_kelas ?? s.subKelas ?? s.sub ?? s.sub_kelas_text;
        const kelasIdStr = typeof kelasRaw === 'string' ? kelasRaw : mapKelasNumberToRoman(kelasRaw);
        const subKelasStr = subRaw == null ? '' : String(subRaw);
        const kelasDisplay = kelasIdStr ? `${kelasIdStr}${subKelasStr ? ' ' + subKelasStr : ''}` : '-';
        const nama_jurusan = s.nama_jurusan ?? s.jurusan_nama ?? s.jurusan ?? '-';
        const kelamin = (s.kelamin ?? s.jk ?? s.gender ?? '').toString().toLowerCase();

        return {
          id_siswa: id,
          nama,
          alamat,
          kelas_id: kelasIdStr,
          sub_kelas: subKelasStr,
          kelasDisplay,
          nama_jurusan,
          kelamin
        };
      };

      const rawData = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
      const normalized = rawData.map(normalizeSiswa);

      let statistikBackend = result.statistik;
      if (statistikBackend && typeof statistikBackend === 'object') {
        setStatistik({
          siswaLaki: statistikBackend.siswaLaki ?? statistikBackend.laki ?? statistikBackend.male ?? 0,
          siswaPerempuan: statistikBackend.siswaPerempuan ?? statistikBackend.perempuan ?? statistikBackend.female ?? 0,
          totalSiswa: statistikBackend.totalSiswa ?? statistikBackend.total ?? normalized.length
        });
      } else {
        const maleSet = ['l', 'male', 'm', 'laki-laki', 'laki'];
        const femaleSet = ['p', 'female', 'f', 'perempuan'];
        const siswaLaki = normalized.filter(s => maleSet.includes((s.kelamin ?? '').toLowerCase())).length;
        const siswaPerempuan = normalized.filter(s => femaleSet.includes((s.kelamin ?? '').toLowerCase())).length;
        setStatistik({
          siswaLaki,
          siswaPerempuan,
          totalSiswa: normalized.length
        });
      }

      setDataSiswa(normalized);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Gagal mengambil data siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilter(prev => ({ ...prev, [field]: value }));
  };

  const handleTampilkan = () => {
    fetchData();
  };

  const handleReset = () => {
    setFilter({
      tahun_daftar: new Date().getFullYear(),
      jurusan_id: '',
      kelas: '',
      filter_nama: ''
    });
  };

  const handleExportExcel = () => {
    if (dataSiswa.length === 0) return;

    const exportData = dataSiswa.map((siswa, idx) => ({
      No: idx + 1,
      'Nama Lengkap': siswa.nama.toUpperCase(),
      'Alamat': siswa.alamat || '-',
      'Kelas': siswa.kelasDisplay || '-',
      'Jurusan': siswa.nama_jurusan || '-',
      'Jenis Kelamin': siswa.kelamin === 'l' || siswa.kelamin === 'laki-laki' || siswa.kelamin === 'male' ? 'Laki-laki' : 
                      siswa.kelamin === 'p' || siswa.kelamin === 'perempuan' || siswa.kelamin === 'female' ? 'Perempuan' : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Siswa');
    
    const namaFile = `Laporan_Siswa_Per_Kelas_${new Date().getFullYear()}.xlsx`;
    XLSX.writeFile(wb, namaFile);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Laporan Siswa Per Kelas</h1>

      {/* Filter Section */}
      <div style={styles.filterCard}>
        <div style={styles.filterRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tahun Daftar</label>
            <input
              type="number"
              value={filter.tahun_daftar}
              onChange={(e) => handleFilterChange('tahun_daftar', e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Jurusan</label>
            <select
              value={filter.jurusan_id}
              onChange={(e) => handleFilterChange('jurusan_id', e.target.value)}
              style={styles.input}
            >
              {jurusanOptions.map((jurusan) => (
                <option key={jurusan.value} value={jurusan.value}>
                  {jurusan.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Kelas</label>
            <select
              value={filter.kelas}
              onChange={(e) => handleFilterChange('kelas', e.target.value)}
              style={styles.input}
            >
              {kelasOptions.map((kelas) => (
                <option key={kelas.value} value={kelas.value}>
                  {kelas.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Cari Nama Siswa</label>
            <input
              type="text"
              value={filter.filter_nama}
              onChange={(e) => handleFilterChange('filter_nama', e.target.value)}
              placeholder="Masukkan nama siswa..."
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
              disabled={loading}
              style={{
                ...styles.primaryButton,
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Memuat...' : 'Tampilkan Data'}
            </button>
            <button
              onClick={handleExportExcel}
              style={{
                ...styles.successButton,
                opacity: dataSiswa.length === 0 ? 0.5 : 1,
                cursor: dataSiswa.length === 0 ? 'not-allowed' : 'pointer'
              }}
              disabled={dataSiswa.length === 0}
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {dataSiswa.length > 0 && (
        <div style={styles.summaryCard}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Siswa:</span>
            <span style={styles.summaryValue}>{statistik.totalSiswa}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Siswa Laki-laki:</span>
            <span style={styles.summaryValue}>{statistik.siswaLaki}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Siswa Perempuan:</span>
            <span style={styles.summaryValue}>{statistik.siswaPerempuan}</span>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>No.</th>
                <th style={styles.th}>Nama Lengkap</th>
                <th style={styles.th}>Alamat</th>
                <th style={styles.th}>Kelas</th>
                <th style={styles.th}>Jurusan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={styles.emptyCell}>
                    Memuat data...
                  </td>
                </tr>
              ) : dataSiswa.length === 0 ? (
                <tr>
                  <td colSpan={5} style={styles.emptyCell}>
                    Tidak ada data siswa yang ditemukan. Klik "Tampilkan Data" untuk memuat data.
                  </td>
                </tr>
              ) : (
                dataSiswa.map((siswa, index) => (
                  <tr key={siswa.id_siswa} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <span style={styles.namaText}>
                        {siswa.nama.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>{siswa.alamat || '-'}</td>
                    <td style={styles.td}>{siswa.kelasDisplay || '-'}</td>
                    <td style={styles.td}>{siswa.nama_jurusan || '-'}</td>
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
  namaText: {
    fontWeight: 600,
    color: '#1f2937'
  }
};

export default LaporanSiswaPerKelas;