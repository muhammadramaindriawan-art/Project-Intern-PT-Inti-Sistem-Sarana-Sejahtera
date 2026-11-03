import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

// Komponen Card untuk digunakan kembali
const Card = ({ children, style, className = '' }) => (
  <div 
    className={`card ${className}`}
    style={{
      background: '#fff',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      ...style
    }}
  >
    {children}
  </div>
);

// Komponen StatCard untuk kartu statistik
const StatCard = ({ title, value, subValue, icon, iconBgColor, loading, trend, trendValue }) => (
  <Card style={{ padding: '20px', cursor: 'pointer', height: '100%' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          {title}
          {loading && <span style={{ fontSize: 12, color: '#999' }}>(Loading...)</span>}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#2c3e50' }}>
          {loading ? '...' : value}
        </div>
        {subValue && (
          <div style={{ fontSize: 14, color: '#666' }}>
            {subValue}
          </div>
        )}
        {trend && trendValue && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4, 
            marginTop: 8,
            fontSize: 13,
            color: trend === 'up' ? '#2ecc71' : '#e74c3c'
          }}>
            <span style={{ 
              transform: trend === 'down' ? 'rotate(180deg)' : 'none',
              fontSize: '16px'
            }}>
              📈
            </span>
            {trendValue}
          </div>
        )}
      </div>
      <div style={{ 
        width: 56, 
        height: 56, 
        background: iconBgColor,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 24,
        flexShrink: 0,
        marginLeft: 12,
        boxShadow: `0 4px 12px ${iconBgColor}40`
      }}>
        {icon}
      </div>
    </div>
  </Card>
);

// Komponen FilterButton untuk filter interaktif
const FilterButton = ({ active, onClick, children, icon }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      borderRadius: 8,
      border: `1px solid ${active ? '#3498db' : '#ddd'}`,
      background: active ? '#3498db15' : 'white',
      color: active ? '#3498db' : '#666',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontWeight: 500,
      fontSize: 14,
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = '#f8f9fa';
        e.currentTarget.style.borderColor = '#3498db';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'white';
        e.currentTarget.style.borderColor = '#ddd';
      }
    }}
  >
    {icon}
    {children}
  </button>
);

const Dashboard = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [siswaStats, setSiswaStats] = useState({
    siswaBaruTahunIni: 0,
    totalSiswa: 0,
    siswaAktif: 0,
    siswaTidakAktif: 0,
    persentaseAktif: 0
  });

  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'pembayaran', 'bantuan'

  // Hitung statistik berdasarkan data siswa
  const calculateStats = useCallback((data) => {
    const currentYear = selectedYear;
    const siswaBaruTahunIni = data.filter(siswa => {
      const tglDaftar = siswa.tgl_daftar ? new Date(siswa.tgl_daftar) : new Date(siswa.created_at);
      return tglDaftar.getFullYear() === currentYear;
    }).length;
    const totalSiswa = data.length;
    const siswaAktif = data.filter(siswa => siswa.status === 1).length;
    const siswaTidakAktif = data.filter(siswa => siswa.status === 0).length;
    
    setSiswaStats({
      siswaBaruTahunIni,
      totalSiswa,
      siswaAktif,
      siswaTidakAktif,
      persentaseAktif: totalSiswa > 0 ? Math.round((siswaAktif / totalSiswa) * 100) : 0
    });
  }, [selectedYear]);

  // Fetch data siswa dari API
  const fetchDataSiswa = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/siswa');
      if (!response.ok) throw new Error('Gagal mengambil data siswa');
      const result = await response.json();
      setDataSiswa(result);
      calculateStats(result);
    } catch (error) {
      console.error('Error fetching siswa data:', error);
      setDataSiswa([]);
      setSiswaStats({
        siswaBaruTahunIni: 0,
        totalSiswa: 0,
        siswaAktif: 0,
        siswaTidakAktif: 0,
        persentaseAktif: 0
      });
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  // Fetch transaksi pembayaran dan bantuan siswa dari API
  const fetchTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      // Ambil data pembayaran dan bantuan siswa secara parallel
      const [pembayaranRes, bantuanRes] = await Promise.all([
        fetch('http://localhost:5000/api/pembayaran'),
        fetch('http://localhost:5000/api/bantuan-siswa')
      ]);

      if (!pembayaranRes.ok || !bantuanRes.ok) {
        throw new Error('Gagal mengambil data transaksi');
      }

      const pembayaranResult = await pembayaranRes.json();
      const bantuanResult = await bantuanRes.json();

      // Format data pembayaran
      const pembayaranData = (pembayaranResult.data || pembayaranResult || []).map((item, idx) => ({
        id: `pembayaran-${item.id || idx + 1}`,
        tanggal: item.tanggal || new Date().toISOString().split('T')[0],
        noBukti: item.id ? String(item.id).padStart(6, '0') : (idx + 1).toString().padStart(6, '0'),
        nama: item.nama_siswa || item.nama || '-',
        pemasukan: item.jumlah_bayar || item.jumlah || 0,
        pengeluaran: 0,
        keterangan: item.status || 'Lunas',
        jenis: 'pembayaran',
        warna: '#19c7a6'
      }));

      // Format data bantuan siswa
      const bantuanData = (bantuanResult.data || bantuanResult || []).map((item, idx) => {
        const jenisBantuan = item.jenis_bantuan || 'Tidak Diketahui';
        return {
          id: `bantuan-${item.id || idx + 1}`,
          tanggal: item.tanggal || new Date().toISOString().split('T')[0],
          noBukti: item.id ? String(item.id).padStart(6, '0') : (idx + 1).toString().padStart(6, '0'),
          nama: item.nama_siswa || item.nama || '-',
          pemasukan: item.jumlah_bantuan || item.jumlah || 0,
          pengeluaran: 0,
          keterangan: jenisBantuan ? `Bantuan ${jenisBantuan}` : 'Bantuan',
          jenis: 'bantuan',
          warna: '#3498db'
        };
      });

      // Gabungkan data dan urutkan berdasarkan tanggal
      const combinedData = [...pembayaranData, ...bantuanData].sort((a, b) => {
        const dateA = new Date(a.tanggal);
        const dateB = new Date(b.tanggal);
        return dateB - dateA; // Urutkan dari terbaru ke terlama
      });

      setTransactions(combinedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Data dummy untuk contoh
      const dummyTransactions = [
        {
          id: '1',
          tanggal: new Date().toISOString().split('T')[0],
          noBukti: '000001',
          nama: 'Ahmad Rizki',
          pemasukan: 1500000,
          keterangan: 'Lunas',
          jenis: 'pembayaran',
          warna: '#19c7a6'
        },
        {
          id: '2',
          tanggal: new Date().toISOString().split('T')[0],
          noBukti: '000002',
          nama: 'Siti Aminah',
          pemasukan: 1200000,
          keterangan: 'Bantuan Beasiswa',
          jenis: 'bantuan',
          warna: '#3498db'
        }
      ];
      setTransactions(dummyTransactions);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // Filter dan format transaksi
  const filteredAndFormattedTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter berdasarkan tanggal
    if (selectedDay) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.tanggal).toISOString().split('T')[0];
        return transactionDate === selectedDay;
      });
    }

    // Filter berdasarkan jenis
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.jenis === filterType);
    }

    // Format untuk tampilan
    return filtered.map(transaction => ({
      ...transaction,
      pemasukanFormatted: `Rp ${transaction.pemasukan.toLocaleString('id-ID')}`,
      tanggalFormatted: new Date(transaction.tanggal).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }));
  }, [transactions, selectedDay, filterType]);

  // Hitung total pemasukan
  const totalPemasukan = useMemo(() => {
    return filteredAndFormattedTransactions.reduce((total, transaction) => {
      return total + transaction.pemasukan;
    }, 0);
  }, [filteredAndFormattedTransactions]);

  // Data rekap siswa baru per tahun (5 tahun ke depan & 5 tahun ke belakang)
  const yearStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push({
        tahun: i,
        siswaBaru: dataSiswa.filter(siswa => {
          const tglDaftar = siswa.tgl_daftar ? new Date(siswa.tgl_daftar) : new Date(siswa.created_at);
          return tglDaftar.getFullYear() === i;
        }).length
      });
    }
    return years; // Sudah urut dari lama ke baru
  }, [dataSiswa]);

  // Format tanggal untuk tampilan
  const formatSelectedDate = useMemo(() => {
    if (selectedDay === new Date().toISOString().split('T')[0]) {
      return 'Hari Ini';
    }
    const date = new Date(selectedDay);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [selectedDay]);

  // Status label component
  const StatusLabel = ({ status }) => {
    if (status.includes('Bantuan')) {
      return (
        <span className="status" style={{ background: '#3498db', color: '#fff' }}>
          {status}
        </span>
      );
    }
    
    switch(status) {
      case 'Lunas':
      case 'Sukses':
        return <span className="status sukses">{status}</span>;
      case 'Proses':
      case 'Belum Lunas':
        return <span className="status proses">{status}</span>;
      case 'Gagal':
        return <span className="status gagal">{status}</span>;
      default:
        return <span className="status default">{status}</span>;
    }
  };

  // useEffect untuk fetch data
  useEffect(() => {
    fetchDataSiswa();
    fetchTransactions();
  }, [fetchDataSiswa, fetchTransactions]);

  return (
    <div className="dashboard" style={{ 
      padding: '20px 24px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      background: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 8 
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2c3e50', margin: 0 }}>
              Dashboard
            </h1>
            <p style={{ color: '#666', fontWeight: 500, fontSize: 14, marginTop: 4 }}>
              Ringkasan data SMK Palapa
            </p>
          </div>
          <div style={{ 
            background: '#3498db', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            📅
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>
      
      {/* Filter Section */}
      <Card style={{ marginBottom: 24, padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333', minWidth: '60px' }}>
              Tahun:
            </label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ 
                padding: '8px 12px', 
                borderRadius: 8, 
                border: '1px solid #ddd',
                background: '#fff',
                fontSize: 14,
                fontWeight: 500,
                minWidth: '120px',
                cursor: 'pointer'
              }}
            >
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i)
                .map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
            </select>
            
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#333', minWidth: '50px' }}>
                Tanggal:
              </label>
              <input 
                type="date" 
                value={selectedDay} 
                onChange={(e) => setSelectedDay(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 8, 
                  border: '1px solid #ddd',
                  background: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333', minWidth: '60px' }}>
              Jenis:
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <FilterButton 
                active={filterType === 'all'} 
                onClick={() => setFilterType('all')}
                icon="👥"
              >
                Semua
              </FilterButton>
              <FilterButton 
                active={filterType === 'pembayaran'} 
                onClick={() => setFilterType('pembayaran')}
                icon="💰"
              >
                Pembayaran
              </FilterButton>
              <FilterButton 
                active={filterType === 'bantuan'} 
                onClick={() => setFilterType('bantuan')}
                icon="🎁"
              >
                Bantuan
              </FilterButton>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 20, 
        marginBottom: 24 
      }}>
        {/* Transaksi Hari Ini */}
        <StatCard
          title={`Transaksi ${formatSelectedDate}`}
          value={`Rp ${totalPemasukan.toLocaleString('id-ID')}`}
          subValue={
            <div>
              <div>{filteredAndFormattedTransactions.length} transaksi</div>
              <div style={{ fontSize: 13, color: totalPemasukan > 0 ? '#2ecc71' : '#666', marginTop: 2 }}>
                {filterType === 'all' ? 'Semua jenis transaksi' : 
                 filterType === 'pembayaran' ? 'Hanya pembayaran' : 'Hanya bantuan'}
              </div>
            </div>
          }
          icon="💰"
          iconBgColor="#f39c12"
          loading={transactionsLoading}
          trend={totalPemasukan > 0 ? 'up' : 'neutral'}
          trendValue={totalPemasukan > 0 ? 'Aktif' : 'Tidak ada transaksi'}
        />

        {/* Siswa Baru Tahun Ini */}
        <StatCard
          title={`Siswa Baru ${selectedYear}`}
          value={`${siswaStats.siswaBaruTahunIni} Siswa`}
          subValue={
            <div>
              <div>Total: {siswaStats.totalSiswa} siswa</div>
              <div style={{ 
                fontSize: 13, 
                color: siswaStats.persentaseAktif > 80 ? '#2ecc71' : 
                       siswaStats.persentaseAktif > 60 ? '#f39c12' : '#e74c3c',
                marginTop: 2 
              }}>
                {siswaStats.persentaseAktif}% Aktif
              </div>
            </div>
          }
          icon="🎓"
          iconBgColor="#3498db"
          loading={loading}
          trend="up"
          trendValue={`${siswaStats.siswaAktif} aktif`}
        />

        {/* Statistik Siswa */}
        {/* HAPUS KARTU INI */}
        {/* <StatCard
          title="Statistik Siswa"
          value={`${siswaStats.totalSiswa}`}
          subValue={
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Aktif</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#2ecc71' }}>
                  {siswaStats.siswaAktif}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Tidak Aktif</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e74c3c' }}>
                  {siswaStats.siswaTidakAktif}
                </div>
              </div>
            </div>
          }
          icon="👥"
          iconBgColor="#2ecc71"
          loading={loading}
        /> */}
      </div>

      {/* Chart dan Table Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 20, 
        marginBottom: 24,
        '@media (max-width: 1024px)': {
          gridTemplateColumns: '1fr'
        }
      }}>
        {/* Diagram Bar Siswa Baru per Tahun */}
        <Card style={{ padding: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 20 
          }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#2c3e50' }}>
              Rekap Siswa Baru per Tahun
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              {selectedYear} • {yearStats.reduce((sum, item) => sum + item.siswaBaru, 0)} total siswa
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yearStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="tahun" 
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={{ stroke: '#ddd' }}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fill: '#666', fontSize: 12 }}
                axisLine={{ stroke: '#ddd' }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 8, 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value) => [`${value} Siswa`, 'Jumlah']}
              />
              <Legend />
              <Bar 
                dataKey="siswaBaru" 
                name="Siswa Baru" 
                fill="#3498db"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Transaksi Terbaru */}
        <Card style={{ padding: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 20 
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#2c3e50' }}>
              Transaksi {formatSelectedDate}
            </div>
            <div style={{ fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: '#19c7a6' 
              }} />
              Pembayaran
              <div style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: '#3498db',
                marginLeft: 8
              }} />
              Bantuan
            </div>
          </div>
          
          <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ 
                background: '#f8f9fa',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}>
                <tr>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#666',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid #eee'
                  }}>
                    Tanggal
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#666',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid #eee'
                  }}>
                    No Bukti
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#666',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid #eee'
                  }}>
                    Nama
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#666',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid #eee'
                  }}>
                    Jumlah
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#666',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid #eee'
                  }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactionsLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ color: '#999', fontSize: 14 }}>Memuat transaksi...</div>
                    </td>
                  </tr>
                ) : filteredAndFormattedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ color: '#999', fontSize: 14 }}>
                        Tidak ada transaksi {selectedDay !== new Date().toISOString().split('T')[0] ? 'pada tanggal ini' : 'hari ini'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndFormattedTransactions.map((transaction, index) => (
                    <tr 
                      key={transaction.id} 
                      style={{ 
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>
                        {transaction.tanggalFormatted}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 500 }}>
                        {transaction.noBukti}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#2c3e50' }}>
                        {transaction.nama}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: 13, 
                        fontFamily: 'monospace', 
                        fontWeight: 600,
                        color: transaction.jenis === 'pembayaran' ? '#19c7a6' : '#3498db'
                      }}>
                        {transaction.pemasukanFormatted}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusLabel status={transaction.keterangan} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {filteredAndFormattedTransactions.length > 0 && (
            <div style={{ 
              marginTop: 16, 
              paddingTop: 16, 
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: 13, color: '#666' }}>
                Menampilkan {filteredAndFormattedTransactions.length} transaksi
              </div>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 600,
                color: '#2c3e50'
              }}>
                Total: Rp {totalPemasukan.toLocaleString('id-ID')}
              </div>
            </div>
          )}
        </Card>
      </div>

      <style>{`
        .dashboard {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        .card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status.sukses { 
          background: #19c7a6; 
          color: #fff; 
        }
        .status.proses { 
          background: #ffd966; 
          color: #222; 
        }
        .status.gagal { 
          background: #ff6b6b; 
          color: #fff; 
        }
        .status.default {
          background: #e2e8f0;
          color: #2d3748;
        }
        
        /* Scrollbar styling */
        table::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        table::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        table::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        table::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        /* Date picker customization */
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        
        /* Select customization */
        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .dashboard {
            padding: 16px;
          }
          
          div[style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }
          
          div[style*="gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;