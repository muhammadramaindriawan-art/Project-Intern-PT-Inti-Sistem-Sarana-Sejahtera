import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const LaporanRekapPerTahun = () => {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Tambahkan state untuk semua kelas
  const [siswaKelasX, setSiswaKelasX] = useState([]);
  const [siswaKelasXI, setSiswaKelasXI] = useState([]);
  const [siswaKelasXII, setSiswaKelasXII] = useState([]);

  // Fungsi fetch siswa per kelas
  const fetchSiswaPerKelas = async (kelasId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/siswa-per-kelas?kelas_id=${kelasId}`);
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    } catch (err) {
      return [];
    }
  };

  // Perbarui fetchData agar ambil semua kelas
  const fetchData = async () => {
    if (!tahun || tahun < 2000 || tahun > 2099) {
      setError('Tahun harus antara 2000-2099');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:5000/api/laporan/rekap-per-tahun?tahun=${tahun}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengambil data');
      }

      setData(result);

      // Ambil data siswa kelas X, XI, XII
      const siswaX = await fetchSiswaPerKelas('1');
      const siswaXI = await fetchSiswaPerKelas('2');
      const siswaXII = await fetchSiswaPerKelas('3');
      setSiswaKelasX(siswaX);
      setSiswaKelasXI(siswaXI);
      setSiswaKelasXII(siswaXII);
    } catch (err) {
      setError(err.message || 'Gagal mengambil data dari server');
      setData(null);
      setSiswaKelasX([]);
      setSiswaKelasXI([]);
      setSiswaKelasXII([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTahun(new Date().getFullYear());
    setData(null);
    setError('');
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  };

  const handleExportExcel = () => {
    if (!data) return;

    // Sheet 1: Ringkasan
    const ringkasan = [
      ['LAPORAN REKAP PER TAHUN', '', ''],
      ['Tahun', tahun, ''],
      ['', '', ''],
      ['STATISTIK SISWA', '', ''],
      ['Total Siswa', data.statistik.siswa.total, ''],
      ['Siswa Laki-laki', data.statistik.siswa.laki, ''],
      ['Siswa Perempuan', data.statistik.siswa.perempuan, ''],
      ['Kelas X', data.statistik.siswa.kelas_x, ''],
      ['Kelas XI', data.statistik.siswa.kelas_xi, ''],
      ['Kelas XII', data.statistik.siswa.kelas_xii, ''],
      ['Jurusan TG', data.statistik.siswa.jurusan_tg, ''],
      ['Jurusan RPL', data.statistik.siswa.jurusan_rpl, ''],
      ['', '', ''],
      ['STATISTIK CALON SISWA', '', ''],
      ['Total Calon Siswa', data.statistik.calon_siswa.total, ''],
      ['Diterima', data.statistik.calon_siswa.diterima, ''],
      ['Ditolak', data.statistik.calon_siswa.ditolak, ''],
      ['Pending', data.statistik.calon_siswa.pending, ''],
      ['', '', ''],
      ['STATISTIK PEMBAYARAN', '', ''],
      ['Total Transaksi', data.statistik.pembayaran.total_transaksi, ''],
      ['Total Pembayaran', data.statistik.pembayaran.total_pembayaran, ''],
      ['Pembayaran Sukses', data.statistik.pembayaran.pembayaran_sukses, ''],
      ['Tunai', data.statistik.pembayaran.tunai, ''],
      ['Transfer', data.statistik.pembayaran.transfer, ''],
      ['KIP', data.statistik.pembayaran.kip, ''],
      ['GNOTA', data.statistik.pembayaran.gnota, ''],
      ['BKSM', data.statistik.pembayaran.bksm, ''],
      ['', '', ''],
      ['STATISTIK TAGIHAN', '', ''],
      ['Total Tagihan', data.statistik.tagihan.total_tagihan, ''],
      ['Total Target', data.statistik.tagihan.total_target, ''],
      ['Total Terbayar', data.statistik.tagihan.total_terbayar, ''],
      ['Total Sisa', data.statistik.tagihan.total_sisa, ''],
      ['Tagihan Lunas', data.statistik.tagihan.tagihan_lunas, ''],
      ['Tagihan Cicilan', data.statistik.tagihan.tagihan_cicilan, ''],
      ['Tagihan Belum Lunas', data.statistik.tagihan.tagihan_belum_lunas, ''],
      ['', '', ''],
      ['STATISTIK BANTUAN', '', ''],
      ['Total Bantuan', data.statistik.bantuan.total_bantuan, ''],
      ['Total Bantuan Diterima', data.statistik.bantuan.total_bantuan_diterima, ''],
      ['Total Bantuan Digunakan', data.statistik.bantuan.total_bantuan_digunakan, ''],
      ['Bantuan KIP', data.statistik.bantuan.bantuan_kip, ''],
      ['Bantuan GNOTA', data.statistik.bantuan.bantuan_gnota, ''],
      ['Bantuan BKSM', data.statistik.bantuan.bantuan_bksm, '']
    ];

    // Sheet 2: Pembayaran per Bulan
    const pembayaranPerBulan = [
      ['Bulan', 'Jumlah Transaksi', 'Total Pembayaran'],
      ...data.rincian.pembayaran_per_bulan.map(item => [
        item.nama_bulan,
        item.jumlah_transaksi,
        item.total_pembayaran
      ])
    ];

    // Sheet 3: Siswa per Jurusan
    const siswaPerJurusan = [
      ['Jurusan', 'Jumlah Siswa', 'Laki-laki', 'Perempuan'],
      ...data.rincian.siswa_per_jurusan.map(item => [
        item.nama_jurusan,
        item.jumlah_siswa,
        item.siswa_laki,
        item.siswa_perempuan
      ])
    ];

    // Sheet 4: Siswa per Alamat
    const siswaPerAlamat = [
      ['Kabupaten', 'Kecamatan', 'Desa', 'Alamat Lengkap', 'Jumlah Siswa', 'Laki-laki', 'Perempuan', 'Kelas X', 'Kelas XI', 'Kelas XII'],
      ...(data.rincian.siswa_per_alamat || []).map(item => [
        item.kabupaten,
        item.kecamatan,
        item.desa,
        item.alamat_lengkap,
        item.jumlah_siswa,
        item.siswa_laki,
        item.siswa_perempuan,
        item.kelas_x,
        item.kelas_xi,
        item.kelas_xii
      ])
    ];

    // Sheet 5: Calon Siswa per Alamat
    const calonSiswaPerAlamat = [
      ['Kabupaten', 'Kecamatan', 'Desa', 'Jumlah Calon Siswa', 'Diterima', 'Ditolak', 'Pending'],
      ...(data.rincian.calon_siswa_per_alamat || []).map(item => [
        item.kabupaten,
        item.kecamatan,
        item.desa,
        item.jumlah_calon_siswa,
        item.diterima,
        item.ditolak,
        item.pending
      ])
    ];

    const wb = XLSX.utils.book_new();
    wb.SheetNames = ['Ringkasan', 'Pembayaran Per Bulan', 'Siswa Per Jurusan', 'Siswa Per Alamat', 'Calon Siswa Per Alamat'];
    wb.Sheets['Ringkasan'] = XLSX.utils.aoa_to_sheet(ringkasan);
    wb.Sheets['Pembayaran Per Bulan'] = XLSX.utils.aoa_to_sheet(pembayaranPerBulan);
    wb.Sheets['Siswa Per Jurusan'] = XLSX.utils.aoa_to_sheet(siswaPerJurusan);
    wb.Sheets['Siswa Per Alamat'] = XLSX.utils.aoa_to_sheet(siswaPerAlamat);
    wb.Sheets['Calon Siswa Per Alamat'] = XLSX.utils.aoa_to_sheet(calonSiswaPerAlamat);

    XLSX.writeFile(wb, `Laporan_Rekap_Per_Tahun_${tahun}.xlsx`);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Laporan Rekap Per Tahun</h1>

      {/* Filter Section */}
      <div style={styles.filterCard}>
        <div style={styles.filterRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tahun</label>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              min="2000"
              max="2099"
              style={styles.input}
              placeholder="Masukkan tahun"
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
              onClick={fetchData}
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
                opacity: data ? 1 : 0.5,
                cursor: data ? 'pointer' : 'not-allowed'
              }}
              disabled={!data}
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorCard}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Data Display */}
      {data && (
        <>
          {/* Statistik Umum */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Statistik Umum - Tahun {tahun}</h2>
            
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Siswa</div>
                <div style={styles.statValue}>{formatNumber(data.statistik.siswa.total)}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Siswa Laki-laki</div>
                <div style={styles.statValue}>{formatNumber(data.statistik.siswa.laki)}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Siswa Perempuan</div>
                <div style={styles.statValue}>{formatNumber(data.statistik.siswa.perempuan)}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Pembayaran</div>
                <div style={styles.statValue}>{formatCurrency(data.statistik.pembayaran.total_pembayaran)}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Target Tagihan</div>
                <div style={styles.statValue}>{formatCurrency(data.statistik.tagihan.total_target)}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Terbayar</div>
                <div style={styles.statValue}>{formatCurrency(data.statistik.tagihan.total_terbayar)}</div>
              </div>
            </div>
          </div>

          {/* Rincian Siswa per Alamat */}
          {data.rincian.siswa_per_alamat && data.rincian.siswa_per_alamat.length > 0 && (
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>Rincian Siswa per Alamat</h2>
              <div style={styles.tableCard}>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead style={styles.thead}>
                      <tr>
                        <th style={styles.th}>Kabupaten</th>
                        <th style={styles.th}>Kecamatan</th>
                        <th style={styles.th}>Desa</th>
                        <th style={styles.th}>Alamat Lengkap</th>
                        <th style={styles.th}>Jumlah Siswa</th>
                        <th style={styles.th}>Laki-laki</th>
                        <th style={styles.th}>Perempuan</th>
                        <th style={styles.th}>Kelas X</th>
                        <th style={styles.th}>Kelas XI</th>
                        <th style={styles.th}>Kelas XII</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rincian.siswa_per_alamat.map((item, index) => (
                        <tr key={index}>
                          <td style={styles.td}>{item.kabupaten}</td>
                          <td style={styles.td}>{item.kecamatan}</td>
                          <td style={styles.td}>{item.desa}</td>
                          <td style={styles.td}>
                            {item.alamat
                              ? item.alamat
                              : item.alamat_lengkap && item.alamat_lengkap !== '-'
                                ? item.alamat_lengkap
                                : [item.desa, item.kecamatan, item.kabupaten].filter(Boolean).join(', ')
                            }
                          </td>
                          <td style={styles.td}>{formatNumber(item.jumlah_siswa)}</td>
                          <td style={styles.td}>{formatNumber(item.siswa_laki)}</td>
                          <td style={styles.td}>{formatNumber(item.siswa_perempuan)}</td>
                          <td style={styles.td}>{formatNumber(item.kelas_x)}</td>
                          <td style={styles.td}>{formatNumber(item.kelas_xi)}</td>
                          <td style={styles.td}>{formatNumber(item.kelas_xii)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Rincian Calon Siswa per Alamat */}
          {data.rincian.calon_siswa_per_alamat && data.rincian.calon_siswa_per_alamat.length > 0 && (
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>Rincian Calon Siswa per Alamat</h2>
              <div style={styles.tableCard}>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead style={styles.thead}>
                      <tr>
                        <th style={styles.th}>Kabupaten</th>
                        <th style={styles.th}>Kecamatan</th>
                        <th style={styles.th}>Desa</th>
                        <th style={styles.th}>Jumlah Calon Siswa</th>
                        <th style={styles.th}>Diterima</th>
                        <th style={styles.th}>Ditolak</th>
                        <th style={styles.th}>Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rincian.calon_siswa_per_alamat.map((item, index) => (
                        <tr key={index}>
                          <td style={styles.td}>{item.kabupaten}</td>
                          <td style={styles.td}>{item.kecamatan}</td>
                          <td style={styles.td}>{item.desa}</td>
                          <td style={styles.td}>{formatNumber(item.jumlah_calon_siswa)}</td>
                          <td style={styles.td}>{formatNumber(item.diterima)}</td>
                          <td style={styles.td}>{formatNumber(item.ditolak)}</td>
                          <td style={styles.td}>{formatNumber(item.pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Statistik Siswa */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Statistik Siswa</h2>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Kelas</th>
                    <th style={styles.th}>Jumlah Siswa</th>
                    <th style={styles.th}>Jurusan TG</th>
                    <th style={styles.th}>Jurusan RPL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.td}>Kelas X</td>
                    <td style={styles.td}>{formatNumber(siswaKelasX.length)}</td>
                    <td style={styles.td}>{formatNumber(countJurusan(siswaKelasX, 1))}</td>
                    <td style={styles.td}>{formatNumber(countJurusan(siswaKelasX, 2))}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Kelas XI</td>
                    <td style={styles.td}>{formatNumber(siswaKelasXI.length)}</td>
                    <td style={styles.td}>{formatNumber(countJurusan(siswaKelasXI, 1))}</td>
                    <td style={styles.td}>{formatNumber(countJurusan(siswaKelasXI, 2))}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Kelas XII</td>
                    <td style={styles.td}>{formatNumber(siswaKelasXII.length)}</td>
                    <td style={styles.td}>{formatNumber(countJurusan(siswaKelasXII, 1))}</td>
                    <td style={styles.td}>{formatNumber(countJurusan(siswaKelasXII, 2))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistik Calon Siswa */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Statistik Calon Siswa</h2>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.td}>Total Calon Siswa</td>
                    <td style={styles.td}>{formatNumber(data.statistik.calon_siswa.total)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Diterima</td>
                    <td style={styles.td}>{formatNumber(data.statistik.calon_siswa.diterima)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Ditolak</td>
                    <td style={styles.td}>{formatNumber(data.statistik.calon_siswa.ditolak)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Pending</td>
                    <td style={styles.td}>{formatNumber(data.statistik.calon_siswa.pending)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistik Pembayaran */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Statistik Pembayaran</h2>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Metode</th>
                    <th style={styles.th}>Jumlah Transaksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.td}>Total Transaksi</td>
                    <td style={styles.td}>{formatNumber(data.statistik.pembayaran.total_transaksi)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Tunai</td>
                    <td style={styles.td}>{formatNumber(data.statistik.pembayaran.tunai)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Transfer</td>
                    <td style={styles.td}>{formatNumber(data.statistik.pembayaran.transfer)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>KIP</td>
                    <td style={styles.td}>{formatNumber(data.statistik.pembayaran.kip)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>GNOTA</td>
                    <td style={styles.td}>{formatNumber(data.statistik.pembayaran.gnota)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>BKSM</td>
                    <td style={styles.td}>{formatNumber(data.statistik.pembayaran.bksm)}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#e8f5e9' }}>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>Total Pembayaran</td>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>{formatCurrency(data.statistik.pembayaran.total_pembayaran)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistik Tagihan */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Statistik Tagihan</h2>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Keterangan</th>
                    <th style={styles.th}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.td}>Total Tagihan</td>
                    <td style={styles.td}>{formatNumber(data.statistik.tagihan.total_tagihan)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Total Target</td>
                    <td style={styles.td}>{formatCurrency(data.statistik.tagihan.total_target)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Total Terbayar</td>
                    <td style={styles.td}>{formatCurrency(data.statistik.tagihan.total_terbayar)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Total Sisa</td>
                    <td style={styles.td}>{formatCurrency(data.statistik.tagihan.total_sisa)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Tagihan Lunas</td>
                    <td style={styles.td}>{formatNumber(data.statistik.tagihan.tagihan_lunas)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Tagihan Cicilan</td>
                    <td style={styles.td}>{formatNumber(data.statistik.tagihan.tagihan_cicilan)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Tagihan Belum Lunas</td>
                    <td style={styles.td}>{formatNumber(data.statistik.tagihan.tagihan_belum_lunas)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistik Bantuan */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Statistik Bantuan</h2>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Jenis Bantuan</th>
                    <th style={styles.th}>Jumlah Transaksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.td}>Total Bantuan</td>
                    <td style={styles.td}>{formatNumber(data.statistik.bantuan.total_bantuan)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>KIP</td>
                    <td style={styles.td}>{formatNumber(data.statistik.bantuan.bantuan_kip)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>GNOTA</td>
                    <td style={styles.td}>{formatNumber(data.statistik.bantuan.bantuan_gnota)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>BKSM</td>
                    <td style={styles.td}>{formatNumber(data.statistik.bantuan.bantuan_bksm)}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#e8f5e9' }}>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>Total Diterima</td>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>{formatCurrency(data.statistik.bantuan.total_bantuan_diterima)}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#ffebee' }}>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>Total Digunakan</td>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>{formatCurrency(data.statistik.bantuan.total_bantuan_digunakan)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Rincian Pembayaran per Bulan */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Rincian Pembayaran per Bulan</h2>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Bulan</th>
                    <th style={styles.th}>Jumlah Transaksi</th>
                    <th style={styles.th}>Total Pembayaran</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rincian.pembayaran_per_bulan.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={styles.emptyCell}>
                        Tidak ada data pembayaran
                      </td>
                    </tr>
                  ) : (
                    data.rincian.pembayaran_per_bulan.map((item, index) => (
                      <tr key={index}>
                        <td style={styles.td}>{item.nama_bulan}</td>
                        <td style={styles.td}>{formatNumber(item.jumlah_transaksi)}</td>
                        <td style={styles.td}>{formatCurrency(item.total_pembayaran)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rincian Siswa per Jurusan */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Rincian Siswa per Jurusan</h2>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Jurusan</th>
                    <th style={styles.th}>Total Siswa</th>
                    <th style={styles.th}>Laki-laki</th>
                    <th style={styles.th}>Perempuan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rincian.siswa_per_jurusan.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={styles.emptyCell}>
                        Tidak ada data siswa
                      </td>
                    </tr>
                  ) : (
                    data.rincian.siswa_per_jurusan.map((item, index) => (
                      <tr key={index}>
                        <td style={styles.td}>{item.nama_jurusan}</td>
                        <td style={styles.td}>{formatNumber(item.jumlah_siswa)}</td>
                        <td style={styles.td}>{formatNumber(item.siswa_laki)}</td>
                        <td style={styles.td}>{formatNumber(item.siswa_perempuan)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daftar Siswa Kelas X */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Daftar Siswa Kelas X</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>No</th>
                  <th style={styles.th}>Nama</th>
                  <th style={styles.th}>Jurusan</th>
                  <th style={styles.th}>Sub Kelas</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(siswaKelasX) ? siswaKelasX : []).map((siswa, idx) => (
                  <tr key={siswa.id_siswa}>
                    <td style={styles.td}>{idx + 1}</td>
                    <td style={styles.td}>{siswa.nama}</td>
                    <td style={styles.td}>{siswa.jurusan_id === 1 ? 'TG' : siswa.jurusan_id === 2 ? 'RPL' : '-'}</td>
                    <td style={styles.td}>{siswa.sub_kelas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Daftar Siswa Kelas XI */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Daftar Siswa Kelas XI</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>No</th>
                  <th style={styles.th}>Nama</th>
                  <th style={styles.th}>Jurusan</th>
                  <th style={styles.th}>Sub Kelas</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(siswaKelasXI) ? siswaKelasXI : []).map((siswa, idx) => (
                  <tr key={siswa.id_siswa}>
                    <td style={styles.td}>{idx + 1}</td>
                    <td style={styles.td}>{siswa.nama}</td>
                    <td style={styles.td}>{siswa.jurusan_id === 1 ? 'TG' : siswa.jurusan_id === 2 ? 'RPL' : '-'}</td>
                    <td style={styles.td}>{siswa.sub_kelas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Daftar Siswa Kelas XII */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Daftar Siswa Kelas XII</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>No</th>
                  <th style={styles.th}>Nama</th>
                  <th style={styles.th}>Jurusan</th>
                  <th style={styles.th}>Sub Kelas</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(siswaKelasXII) ? siswaKelasXII : []).map((siswa, idx) => (
                  <tr key={siswa.id_siswa}>
                    <td style={styles.td}>{idx + 1}</td>
                    <td style={styles.td}>{siswa.nama}</td>
                    <td style={styles.td}>{siswa.jurusan_id === 1 ? 'TG' : siswa.jurusan_id === 2 ? 'RPL' : '-'}</td>
                    <td style={styles.td}>{siswa.sub_kelas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div style={styles.emptyCard}>
          <p>Silakan pilih tahun dan klik "Tampilkan Data" untuk melihat laporan rekap per tahun.</p>
        </div>
      )}
    </div>
  );
};

const countJurusan = (arr, jurusanId) =>
  Array.isArray(arr) ? arr.filter(s => s.jurusan_id === jurusanId).length : 0;

const styles = {
  container: {
    maxWidth: 1400,
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
  errorCard: {
    background: '#ffebee',
    color: '#c62828',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    border: '1px solid #ef5350'
  },
  sectionCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    color: '#1a202c',
    borderBottom: '2px solid #4299e1',
    paddingBottom: 8
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16
  },
  statCard: {
    background: '#f7fafc',
    padding: 20,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    textAlign: 'center'
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    fontWeight: 500
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#2d3748'
  },
  tableCard: {
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
  td: {
    padding: 16,
    color: '#4a5568',
    borderBottom: '1px solid #f1f3f5'
  },
  emptyCell: {
    textAlign: 'center',
    padding: 48,
    color: '#a0aec0',
    fontSize: 14
  },
  emptyCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 48,
    textAlign: 'center',
    color: '#718096',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0'
  }
};

export default LaporanRekapPerTahun;


