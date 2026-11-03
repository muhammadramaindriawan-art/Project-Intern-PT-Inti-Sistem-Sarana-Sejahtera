import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const RiwayatBantuanSemuaSiswa = () => {
  const [jenisBantuan, setJenisBantuan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [dataSiswa, setDataSiswa] = useState([]);
  const [dataBantuan, setDataBantuan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [searchNama, setSearchNama] = useState('');

  // Opsi jenis bantuan
  const jenisBantuanOptions = [
    { value: '', label: 'Semua Jenis' },
    { value: 'KIP', label: 'KIP' },
    { value: 'GNOTA', label: 'GNOTA' },
    { value: 'BKSM', label: 'BKSM' }
  ];

  // Fetch daftar siswa
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        setLoading(true);

        // Ambil data siswa
        const siswaResponse = await fetch('http://localhost:5000/api/siswa');
        if (!siswaResponse.ok) throw new Error('Gagal mengambil data siswa');
        const siswaResult = await siswaResponse.json();
        
        // Ambil data bantuan
        const bantuanResponse = await fetch('http://localhost:5000/api/bantuan-siswa');
        if (!bantuanResponse.ok) throw new Error('Gagal mengambil data bantuan');
        const bantuanResult = await bantuanResponse.json();

        if (bantuanResult.success) {
          setDataSiswa(Array.isArray(siswaResult) ? siswaResult : []);
          setDataBantuan(Array.isArray(bantuanResult.data) ? bantuanResult.data : []);
        } else {
          setError('Gagal memuat data bantuan');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Gagal memuat data');
        setDataSiswa([]);
        setDataBantuan([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Format data untuk setiap siswa
  const formatRiwayatSiswa = () => {
    return dataSiswa
      .filter(siswa => {
        // Filter berdasarkan pencarian nama
        if (searchNama.trim()) {
          return siswa.nama.toLowerCase().includes(searchNama.toLowerCase());
        }
        return true;
      })
      .map(siswa => {
        // Ambil data bantuan untuk siswa ini
        const bantuanSiswa = dataBantuan.filter(item => item.id_siswa === siswa.id_siswa);
        
        // Filter berdasarkan jenis bantuan jika dipilih
        let filteredBantuan = bantuanSiswa;
        if (jenisBantuan) {
          filteredBantuan = filteredBantuan.filter(item => item.jenis_bantuan === jenisBantuan);
        }
        
        // Filter berdasarkan tanggal jika dipilih
        if (tanggal) {
          filteredBantuan = filteredBantuan.filter(item => item.tanggal === tanggal);
        }
        
        // Urutkan berdasarkan tanggal
        filteredBantuan.sort((a, b) => {
          const dateA = new Date(a.tanggal + (a.waktu ? ' ' + a.waktu : ''));
          const dateB = new Date(b.tanggal + (b.waktu ? ' ' + b.waktu : ''));
          return dateA - dateB;
        });

        // Hitung saldo
        let saldoAwal = 0;
        const riwayat = filteredBantuan.map(item => {
          const debet = item.jumlah >= 0 ? Number(item.jumlah) : 0;
          const kredit = item.jumlah < 0 ? Math.abs(Number(item.jumlah)) : 0;
          const saldoAkhir = saldoAwal + debet - kredit;
          
          const row = {
            ...item,
            saldoAwal,
            debet,
            kredit,
            saldoAkhir
          };
          
          saldoAwal = saldoAkhir;
          return row;
        });

        // Hitung total dan saldo akhir
        const totalDebet = riwayat.reduce((sum, item) => sum + item.debet, 0);
        const totalKredit = riwayat.reduce((sum, item) => sum + item.kredit, 0);
        const saldoAkhir = riwayat.length > 0 ? riwayat[riwayat.length - 1]?.saldoAkhir || 0 : 0;

        return {
          id: siswa.id_siswa,
          nama: siswa.nama,
          nis: siswa.nis || '-',
          kelas: siswa.kelas || '-',
          jumlahTransaksi: riwayat.length,
          totalDebet,
          totalKredit,
          saldoAkhir,
          riwayat,
          isEmpty: riwayat.length === 0
        };
      })
      .filter(siswa => showAll ? true : !siswa.isEmpty) // Tampilkan semua atau hanya yang punya data
      .sort((a, b) => a.nama.localeCompare(b.nama)); // Urutkan berdasarkan nama
  };

  const dataSiswaDenganRiwayat = formatRiwayatSiswa();

  const formatTanggal = (tanggalString) => {
    if (!tanggalString) return '-';
    try {
      const date = new Date(tanggalString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const formatRupiah = (nominal) => {
    const angka = Number(nominal || 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const handleCari = () => {
    // Data sudah dihitung realtime, jadi hanya perlu memastikan state diupdate
    setError('');
  };

  const handleReset = () => {
    setJenisBantuan('');
    setTanggal('');
    setSearchNama('');
    setShowAll(false);
    setError('');
  };

  const handleExportExcel = () => {
    if (dataSiswaDenganRiwayat.length === 0) {
      setError('Tidak ada data untuk diexport');
      return;
    }

    try {
      // Data summary per siswa
      const summaryData = dataSiswaDenganRiwayat.map((siswa, idx) => ({
        'No': idx + 1,
        'Nama Siswa': siswa.nama,
        'NIS': siswa.nis,
        'Kelas': siswa.kelas,
        'Jumlah Transaksi': siswa.jumlahTransaksi,
        'Total Debet': siswa.totalDebet,
        'Total Kredit': siswa.totalKredit,
        'Saldo Akhir': siswa.saldoAkhir
      }));

      // Data detail semua transaksi
      const detailData = [];
      dataSiswaDenganRiwayat.forEach(siswa => {
        if (siswa.riwayat.length > 0) {
          siswa.riwayat.forEach((item, idx) => {
            detailData.push({
              'Nama Siswa': siswa.nama,
              'NIS': siswa.nis,
              'Kelas': siswa.kelas,
              'No Transaksi': idx + 1,
              'Tanggal': formatTanggal(item.tanggal),
              'Keterangan': `BANTUAN ${item.jenis_bantuan || ''}`.toUpperCase(),
              'Saldo Awal': item.saldoAwal,
              'Debet': item.debet,
              'Kredit': item.kredit,
              'Saldo Akhir': item.saldoAkhir
            });
          });
        }
      });

      const wb = XLSX.utils.book_new();
      
      // Sheet 1: Summary
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Siswa');
      
      // Sheet 2: Detail
      if (detailData.length > 0) {
        const wsDetail = XLSX.utils.json_to_sheet(detailData);
        XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Transaksi');
      }
      
      const namaFile = `Riwayat_Bantuan_Semua_Siswa_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, namaFile);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Gagal mengexport data ke Excel');
    }
  };

  const totalSummary = {
    totalSiswa: dataSiswaDenganRiwayat.length,
    totalTransaksi: dataSiswaDenganRiwayat.reduce((sum, siswa) => sum + siswa.jumlahTransaksi, 0),
    totalDebet: dataSiswaDenganRiwayat.reduce((sum, siswa) => sum + siswa.totalDebet, 0),
    totalKredit: dataSiswaDenganRiwayat.reduce((sum, siswa) => sum + siswa.totalKredit, 0),
    totalSaldo: dataSiswaDenganRiwayat.reduce((sum, siswa) => sum + siswa.saldoAkhir, 0)
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Riwayat Bantuan Semua Siswa</h1>

      {/* Filter Section */}
      <div style={styles.filterCard}>
        <div style={styles.filterRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Cari Nama Siswa</label>
            <input
              type="text"
              value={searchNama}
              onChange={(e) => setSearchNama(e.target.value)}
              placeholder="Cari berdasarkan nama..."
              style={styles.input}
              disabled={loading}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Jenis Bantuan</label>
            <select
              value={jenisBantuan}
              onChange={(e) => setJenisBantuan(e.target.value)}
              style={styles.input}
              disabled={loading}
            >
              {jenisBantuanOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tanggal</label>
            <input 
              type="date" 
              value={tanggal} 
              onChange={(e) => setTanggal(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tampilkan</label>
            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                id="showAll"
                disabled={loading}
              />
              <label htmlFor="showAll" style={styles.checkboxLabel}>
                Semua Siswa (termasuk yang belum ada datanya)
              </label>
            </div>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button 
            onClick={handleReset}
            style={styles.resetButton}
            disabled={loading}
          >
            Reset
          </button>
          <button 
            onClick={handleCari}
            disabled={loading}
            style={{
              ...styles.primaryButton,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Memuat...' : 'Terapkan Filter'}
          </button>
          <button
            onClick={handleExportExcel}
            style={{
              ...styles.successButton,
              opacity: dataSiswaDenganRiwayat.length === 0 ? 0.5 : 1,
              cursor: dataSiswaDenganRiwayat.length === 0 ? 'not-allowed' : 'pointer'
            }}
            disabled={dataSiswaDenganRiwayat.length === 0}
          >
            Export Excel
          </button>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Summary Section */}
      {dataSiswaDenganRiwayat.length > 0 && (
        <div style={styles.summarySection}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Jumlah Siswa</div>
                <div style={styles.summaryValue}>{totalSummary.totalSiswa}</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Total Transaksi</div>
                <div style={styles.summaryValue}>{totalSummary.totalTransaksi}</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Total Debet</div>
                <div style={styles.summaryValue}>{formatRupiah(totalSummary.totalDebet)}</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Total Kredit</div>
                <div style={styles.summaryValue}>{formatRupiah(totalSummary.totalKredit)}</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Total Saldo</div>
                <div style={styles.saldoAkhirValue}>{formatRupiah(totalSummary.totalSaldo)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Section */}
      {dataSiswaDenganRiwayat.length > 0 ? (
        <div style={styles.dataSection}>
          {dataSiswaDenganRiwayat.map((siswa) => (
            <div key={siswa.id} style={styles.siswaCard}>
              <div style={styles.siswaHeader}>
                <div style={styles.siswaInfo}>
                  <div style={styles.siswaName}>{siswa.nama}</div>
                  <div style={styles.siswaDetail}>
                    <span>NIS: {siswa.nis}</span>
                    <span style={styles.divider}>•</span>
                    <span>Kelas: {siswa.kelas}</span>
                    <span style={styles.divider}>•</span>
                    <span>Transaksi: {siswa.jumlahTransaksi}</span>
                    <span style={styles.divider}>•</span>
                    <span style={styles.saldoSiswa}>
                      Saldo: {formatRupiah(siswa.saldoAkhir)}
                    </span>
                  </div>
                </div>
                <div style={styles.siswaSummary}>
                  <div style={styles.siswaSummaryItem}>
                    <span>Debet:</span>
                    <span style={styles.positiveAmount}>{formatRupiah(siswa.totalDebet)}</span>
                  </div>
                  <div style={styles.siswaSummaryItem}>
                    <span>Kredit:</span>
                    <span style={styles.negativeAmount}>{formatRupiah(siswa.totalKredit)}</span>
                  </div>
                </div>
              </div>

              {/* Tabel riwayat untuk siswa ini */}
              {siswa.riwayat.length > 0 && (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.thNo}>No</th>
                        <th style={styles.thTanggal}>Tanggal</th>
                        <th style={styles.thKeterangan}>Keterangan</th>
                        <th style={styles.thNumber}>Saldo Awal</th>
                        <th style={styles.thNumber}>Debet</th>
                        <th style={styles.thNumber}>Kredit</th>
                        <th style={styles.thNumber}>Saldo Akhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siswa.riwayat.map((item, index) => (
                        <tr key={`${siswa.id}-${index}`} style={styles.tr}>
                          <td style={styles.tdNo}>{index + 1}</td>
                          <td style={styles.tdTanggal}>{formatTanggal(item.tanggal)}</td>
                          <td style={styles.tdKeterangan}>
                            <span style={{
                              ...styles.badge,
                              background: item.jumlah < 0 ? '#fff3cd' : '#e3f2fd',
                              color: item.jumlah < 0 ? '#856404' : '#1976d2'
                            }}>
                              {item.jumlah < 0 
                                ? `PENGGUNAAN ${(item.jenis_bantuan || '').toUpperCase()}`
                                : `BANTUAN ${(item.jenis_bantuan || '').toUpperCase()}`}
                            </span>
                          </td>
                          <td style={styles.tdNumber}>{formatRupiah(item.saldoAwal)}</td>
                          <td style={styles.tdNumber}>
                            <span style={styles.positiveAmount}>
                              {formatRupiah(item.debet)}
                            </span>
                          </td>
                          <td style={styles.tdNumber}>
                            <span style={styles.negativeAmount}>
                              {formatRupiah(item.kredit)}
                            </span>
                          </td>
                          <td style={styles.tdNumber}>
                            <span style={styles.finalAmount}>
                              {formatRupiah(item.saldoAkhir)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {siswa.riwayat.length === 0 && (
                <div style={styles.noDataMessage}>
                  Tidak ada data bantuan untuk siswa ini
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>📝</div>
          <div style={styles.emptyStateText}>
            {loading ? 'Memuat data...' : 'Tidak ada data yang sesuai dengan filter'}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: 24,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 24,
    color: '#1a202c',
    textAlign: 'center'
  },
  filterCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0'
  },
  filterRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    alignItems: 'end'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    marginBottom: 8,
    fontWeight: 600,
    color: '#2d3748',
    fontSize: 14
  },
  input: {
    padding: 12,
    borderRadius: 8,
    border: '1px solid #cbd5e0',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    width: '100%'
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4a5568',
    cursor: 'pointer'
  },
  buttonGroup: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 16
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
    transition: 'all 0.2s',
    flex: 1
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
    transition: 'all 0.2s',
    flex: 1
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
    transition: 'all 0.2s',
    flex: 1
  },
  errorMessage: {
    marginTop: 16,
    padding: 12,
    background: '#fed7d7',
    color: '#c53030',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    border: '1px solid #feb2b2'
  },
  summarySection: {
    marginBottom: 20
  },
  summaryCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 20
  },
  summaryItem: {
    textAlign: 'center',
    padding: 12
  },
  summaryLabel: {
    fontSize: 13,
    color: '#718096',
    fontWeight: 600,
    marginBottom: 8
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#2d3748'
  },
  saldoAkhirValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#48bb78'
  },
  dataSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  siswaCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s'
  },
  siswaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: '2px solid #f1f3f5'
  },
  siswaInfo: {
    flex: 1
  },
  siswaName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a202c',
    marginBottom: 4
  },
  siswaDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#718096',
    flexWrap: 'wrap'
  },
  divider: {
    color: '#cbd5e0'
  },
  saldoSiswa: {
    fontWeight: 600,
    color: '#48bb78'
  },
  siswaSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 200
  },
  siswaSummaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    padding: '4px 0'
  },
  tableWrapper: {
    overflowX: 'auto',
    marginTop: 12
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13
  },
  thNo: {
    width: '50px',
    padding: '12px 8px',
    textAlign: 'center',
    fontWeight: 600,
    color: '#2d3748',
    borderBottom: '2px solid #e2e8f0'
  },
  thTanggal: {
    width: '100px',
    padding: '12px 8px',
    fontWeight: 600,
    color: '#2d3748',
    borderBottom: '2px solid #e2e8f0'
  },
  thKeterangan: {
    padding: '12px 8px',
    fontWeight: 600,
    color: '#2d3748',
    borderBottom: '2px solid #e2e8f0'
  },
  thNumber: {
    width: '120px',
    padding: '12px 8px',
    fontWeight: 600,
    color: '#2d3748',
    borderBottom: '2px solid #e2e8f0',
    textAlign: 'right'
  },
  tr: {
    borderBottom: '1px solid #f1f3f5'
  },
  tdNo: {
    width: '50px',
    padding: '12px 8px',
    textAlign: 'center',
    color: '#4a5568'
  },
  tdTanggal: {
    width: '100px',
    padding: '12px 8px',
    color: '#4a5568'
  },
  tdKeterangan: {
    padding: '12px 8px',
    color: '#4a5568'
  },
  tdNumber: {
    width: '120px',
    padding: '12px 8px',
    color: '#4a5568',
    textAlign: 'right',
    fontFamily: "'Courier New', monospace",
    fontWeight: 500
  },
  badge: {
    background: '#e3f2fd',
    color: '#1976d2',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: 11,
    fontWeight: 600,
    display: 'inline-block'
  },
  positiveAmount: {
    color: '#2e7d32',
    fontWeight: 600
  },
  negativeAmount: {
    color: '#c62828',
    fontWeight: 600
  },
  finalAmount: {
    color: '#1976d2',
    fontWeight: 600
  },
  noDataMessage: {
    textAlign: 'center',
    padding: 20,
    color: '#a0aec0',
    fontSize: 14,
    fontStyle: 'italic'
  },
  emptyState: {
    textAlign: 'center',
    padding: 60,
    color: '#718096',
    fontSize: 16,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginTop: 20
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 500
  }
};

export default RiwayatBantuanSemuaSiswa;