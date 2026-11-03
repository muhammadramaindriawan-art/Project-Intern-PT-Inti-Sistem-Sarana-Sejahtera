import React, { useState, useEffect } from 'react';

// Kelas options disamakan dengan PembayaranBaru.js
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

// Fungsi normalisasi kelas agar filter konsisten
const normalizeKelas = (siswa) => {
  if (!siswa) return '';
  let kelas = '';
  if (siswa.kelas_id === 1) kelas = 'X';
  else if (siswa.kelas_id === 2) kelas = 'XI';
  else if (siswa.kelas_id === 3) kelas = 'XII';

  let jurusan = '';
  if (siswa.jurusan_id === 1) jurusan = 'TG';
  else if (siswa.jurusan_id === 2) jurusan = 'RPL';

  if (kelas && jurusan) return `${kelas}-${jurusan}`;
  return kelas || '';
};

const TransaksiPembayaranSiswa = () => {
  const [namaSiswa, setNamaSiswa] = useState('');
  const [siswaData, setSiswaData] = useState(null);
  const [tagihan, setTagihan] = useState([]);
  const [selectedTagihan, setSelectedTagihan] = useState([]);
  const [bayar, setBayar] = useState(''); // awalnya kosong
  const [metode, setMetode] = useState('tunai');
  const [daftarSiswa, setDaftarSiswa] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saldoBantuan, setSaldoBantuan] = useState({});
  const [gunakanBantuan, setGunakanBantuan] = useState(false);
  const [kelasFilter, setKelasFilter] = useState('');

  // Fetch daftar siswa
  useEffect(() => {
    fetch('http://localhost:5000/api/siswa')
      .then(res => res.json())
      .then(data => setDaftarSiswa(data))
      .catch(() => setDaftarSiswa([]));
  }, []);

  // Update suggestions dengan filter kelas yang sudah dinormalisasi
  useEffect(() => {
    if (namaSiswa.trim() === '') {
      setSuggestions([]);
      return;
    }
    const q = namaSiswa.toLowerCase();
    const filtered = daftarSiswa.filter(s => {
      const siswaKelas = normalizeKelas(s);
      const filterKelasNorm = kelasFilter;
      // Pencarian berdasarkan ID atau nama dan juga cocok kelas jika di-set
      const matchNamaOrId = String(s.id_siswa).toLowerCase().includes(q) || (s.nama || '').toLowerCase().includes(q);
      const matchKelas = filterKelasNorm === '' || siswaKelas === filterKelasNorm || siswaKelas.startsWith(filterKelasNorm);
      return matchNamaOrId && matchKelas;
    });
    setSuggestions(filtered.slice(0, 10));
  }, [namaSiswa, daftarSiswa, kelasFilter]);

  // Fungsi untuk mengambil saldo bantuan siswa
  const fetchSaldoBantuan = async (siswaId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/saldo-bantuan/${siswaId}`);
      const result = await res.json();
      if (result.success) {
        setSaldoBantuan(result.data || {});
      }
    } catch (err) {
      console.error('Error fetching saldo bantuan:', err);
      setSaldoBantuan({});
    }
  };

  // Fungsi cari tagihan
  const handleCari = async () => {
    const siswa = daftarSiswa.find(s => String(s.id_siswa) === namaSiswa || (s.nama || '').toLowerCase() === namaSiswa.toLowerCase());
    if (!siswa) {
      setMessage({ type: 'error', text: 'Siswa tidak ditemukan' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`http://localhost:5000/api/tagihan?siswa_id=${siswa.id_siswa}`);
      const result = await res.json();
      
      if (result.success) {
        setTagihan(result.data);
        setSiswaData(result.siswa);
        setSelectedTagihan([]);
        setBayar(0);
        setGunakanBantuan(false);
        // Ambil saldo bantuan siswa
        await fetchSaldoBantuan(siswa.id_siswa);
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal memuat tagihan' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menghubungi server' });
    } finally {
      setLoading(false);
    }
  };

  // Toggle pilih tagihan
  const toggleTagihan = (id) => {
    setSelectedTagihan(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // Hitung total
  const totalTarget = tagihan.reduce((a, b) => a + (parseFloat(b.nilai) || 0), 0);
  const totalTerbayar = tagihan.reduce((a, b) => a + (parseFloat(b.terbayar) || 0), 0);
  const sisaTarget = totalTarget - totalTerbayar;
  const tunggakan = Math.max(0, sisaTarget - bayar);

  // Proses pembayaran
  const handleBayar = async () => {
    if (!siswaData) {
      setMessage({ type: 'error', text: 'Pilih siswa terlebih dahulu' });
      return;
    }

    // Validasi jumlah bayar
    if (!bayar || isNaN(bayar) || parseFloat(bayar) <= 0) {
      setMessage({ type: 'error', text: 'Masukkan jumlah pembayaran' });
      return;
    }

    // Validasi jika menggunakan bantuan
    if (gunakanBantuan && ['kip', 'gnota', 'bksm'].includes(metode.toLowerCase())) {
      const jenisBantuan = metode.toUpperCase();
      const saldoTersedia = saldoBantuan[jenisBantuan]?.saldo_tersedia || 0;
      const jumlahBayar = parseFloat(bayar);
      
      if (jumlahBayar > saldoTersedia) {
        setMessage({ 
          type: 'error', 
          text: `Saldo ${jenisBantuan} tidak mencukupi. Saldo tersedia: Rp ${saldoTersedia.toLocaleString('id-ID')}` 
        });
        return;
      }
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('http://localhost:5000/api/tagihan/bayar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswa_id: siswaData.id_siswa,
          jumlah_bayar: parseFloat(bayar), // Kirim jumlah_bayar sebagai angka
          metode: metode,
          tagihan_ids: selectedTagihan.length > 0 ? selectedTagihan : null,
          gunakan_bantuan: gunakanBantuan && ['kip', 'gnota', 'bksm'].includes(metode.toLowerCase())
        })
      });

      const result = await res.json();

      if (result.success) {
        let successMsg = 'Pembayaran berhasil!';
        if (result.penggunaan_bantuan && result.penggunaan_bantuan.length > 0) {
          const bantuanUsed = result.penggunaan_bantuan[0];
          successMsg += ` Menggunakan ${bantuanUsed.jenis}: Rp ${bantuanUsed.jumlah.toLocaleString('id-ID')}`;
        }
        setMessage({ type: 'success', text: successMsg });
        handleCari();
      } else {
        setMessage({ type: 'error', text: result.error || 'Pembayaran gagal' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal memproses pembayaran' });
    } finally {
      setLoading(false);
    }
  };

  const handleBatal = () => {
    setNamaSiswa('');
    setSiswaData(null);
    setTagihan([]);
    setSelectedTagihan([]);
    setBayar(0);
    setMetode('tunai');
    setMessage({ type: '', text: '' });
    setSaldoBantuan({});
    setGunakanBantuan(false);
  };

  // Daftar siswa berdasarkan kelasFilter (untuk fitur lihat siswa per kelas)
  const siswaPerKelas = daftarSiswa.filter(s => {
    if (!kelasFilter) return true; // semua
    return normalizeKelas(s) === kelasFilter;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.07)', padding: 24 }}>
      <h2 style={{ marginBottom: 16, color: '#1a202c' }}>Transaksi Pembayaran Siswa</h2>
      
      {/* Alert Message */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 16,
          background: message.type === 'success' ? '#c6f6d5' : '#fed7d7',
          color: message.type === 'success' ? '#22543d' : '#742a2a',
          border: `1px solid ${message.type === 'success' ? '#9ae6b4' : '#fc8181'}`
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Filter Kelas + Lihat Siswa */}
        <div style={{ marginBottom: 12, minWidth: 300 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
            Filter Kelas
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={kelasFilter}
              onChange={e => setKelasFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e0',
                width: 220,
                fontSize: 14
              }}
            >
              {kelasOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Tombol untuk reset filter */}
            <button
              onClick={() => setKelasFilter('')}
              style={{ padding: '8px 12px', borderRadius: 6, background: '#edf2f7', border: '1px solid #cbd5e0', cursor: 'pointer' }}
              title="Reset filter kelas"
            >
              Reset
            </button>
          </div>

          {/* Tampilan singkat daftar siswa pada kelas yang dipilih */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 6 }}>Menampilkan {siswaPerKelas.length} siswa{kelasFilter ? ` pada ${kelasOptions.find(o => o.value === kelasFilter)?.label || kelasFilter}` : ''}</div>
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6, padding: 8, background: '#fff' }}>
              {siswaPerKelas.length === 0 ? (
                <div style={{ color: '#718096', fontSize: 13, padding: 8 }}>Tidak ada siswa.</div>
              ) : (
                siswaPerKelas.map(s => (
                  <div key={s.id_siswa} style={{ padding: 8, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{s.nama}</div>
                      <div style={{ fontSize: 12, color: '#718096' }}>ID: {s.id_siswa} • Kelas: {normalizeKelas(s)}</div>
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          setNamaSiswa(String(s.id_siswa));
                          setSuggestions([]);
                        }}
                        style={{ padding: '6px 10px', borderRadius: 6, background: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer' }}
                      >
                        Pilih
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Form Input pencarian dan tanggal */}
        <div style={{ flex: 1, minWidth: 380 }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                ID / Nama Siswa
              </label>
              <input
                value={namaSiswa}
                onChange={e => setNamaSiswa(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 6, 
                  border: '1px solid #cbd5e0', 
                  width: '100%',
                  fontSize: 14
                }}
                autoComplete="off"
                placeholder="Ketik ID atau nama siswa"
              />
              {suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 70,
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #cbd5e0',
                  borderRadius: 6,
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  maxHeight: 200,
                  overflowY: 'auto'
                }}>
                  {suggestions.map(s => (
                    <div
                      key={s.id_siswa}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #edf2f7',
                        fontSize: 14
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#edf2f7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      onClick={() => {
                        setNamaSiswa(String(s.id_siswa));
                        setSuggestions([]);
                        handleCari(); // Panggil handleCari langsung saat tombol "Pilih" ditekan
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{s.id_siswa}</div>
                      <div style={{ fontSize: 12, color: '#718096' }}>{s.nama} • Kelas: {normalizeKelas(s)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                Tanggal
              </label>
              <input 
                value={new Date().toLocaleDateString('id-ID')} 
                disabled 
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 6, 
                  border: '1px solid #cbd5e0', 
                  width: 140, 
                  background: '#f7fafc',
                  fontSize: 14
                }} 
              />
            </div>
          </div>

          {/* Info Siswa */}
          {siswaData && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                background: '#edf2f7', 
                padding: 12, 
                borderRadius: 6, 
                marginBottom: 12,
                fontSize: 14
              }}>
                <strong>Siswa:</strong> {siswaData.nama} (ID: {siswaData.id_siswa})
              </div>
              
              {/* Saldo Bantuan */}
              {(saldoBantuan.KIP || saldoBantuan.GNOTA || saldoBantuan.BKSM) && (
                <div style={{ 
                  background: '#e6fffa', 
                  padding: 12, 
                  borderRadius: 6, 
                  border: '1px solid #81e6d9',
                  fontSize: 14
                }}>
                  <strong style={{ display: 'block', marginBottom: 8, color: '#234e52' }}>
                    Saldo Bantuan Tersedia:
                  </strong>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {saldoBantuan.KIP && saldoBantuan.KIP.saldo_tersedia > 0 && (
                      <div style={{ color: '#234e52' }}>
                        <strong>KIP:</strong> Rp {saldoBantuan.KIP.saldo_tersedia.toLocaleString('id-ID')}
                      </div>
                    )}
                    {saldoBantuan.GNOTA && saldoBantuan.GNOTA.saldo_tersedia > 0 && (
                      <div style={{ color: '#234e52' }}>
                        <strong>GNOTA:</strong> Rp {saldoBantuan.GNOTA.saldo_tersedia.toLocaleString('id-ID')}
                      </div>
                    )}
                    {saldoBantuan.BKSM && saldoBantuan.BKSM.saldo_tersedia > 0 && (
                      <div style={{ color: '#234e52' }}>
                        <strong>BKSM:</strong> Rp {saldoBantuan.BKSM.saldo_tersedia.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabel Tagihan */}
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f7fafc' }}>
                  <th style={{ ...thStyle, width: 40 }}>
                    <input 
                      type="checkbox" 
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedTagihan(tagihan.filter(t => t.status !== 'lunas').map(t => t.id));
                        } else {
                          setSelectedTagihan([]);
                        }
                      }}
                      checked={selectedTagihan.length > 0 && selectedTagihan.length === tagihan.filter(t => t.status !== 'lunas').length}
                    />
                  </th>
                  <th style={thStyle}>Nama Tagihan</th>
                  <th style={thStyle}>Jatuh Tempo</th>
                  <th style={thStyle}>Nilai</th>
                  <th style={thStyle}>Terbayar</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tagihan.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#718096' }}>
                      {loading ? 'Memuat data...' : 'Tidak ada tagihan. Pilih siswa dan klik Cari.'}
                    </td>
                  </tr>
                ) : (
                  tagihan.map((t) => (
                    <tr key={t.id} style={{ background: t.status === 'lunas' ? '#f0fff4' : '#fff' }}>
                      <td style={tdStyle}>
                        <input 
                          type="checkbox"
                          checked={selectedTagihan.includes(t.id)}
                          onChange={() => toggleTagihan(t.id)}
                          disabled={t.status === 'lunas'}
                        />
                      </td>
                      <td style={tdStyle}>{t.nama_tagihan}</td>
                      <td style={tdStyle}>
                        {t.jatuh_tempo ? new Date(t.jatuh_tempo).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td style={tdStyle}>Rp {parseFloat(t.nilai || 0).toLocaleString('id-ID')}</td>
                      <td style={tdStyle}>Rp {parseFloat(t.terbayar || 0).toLocaleString('id-ID')}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          background: t.status === 'lunas' ? '#c6f6d5' : t.status === 'cicilan' ? '#feebc8' : '#fed7d7',
                          color: t.status === 'lunas' ? '#22543d' : t.status === 'cicilan' ? '#7c2d12' : '#742a2a'
                        }}>
                          {t.status === 'lunas' ? 'Lunas' : t.status === 'cicilan' ? 'Cicilan' : 'Belum Lunas'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: 16, 
            marginBottom: 16,
            padding: 16,
            background: '#f7fafc',
            borderRadius: 8
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#718096' }}>Total Target</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a202c' }}>
                Rp {totalTarget.toLocaleString('id-ID')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#718096' }}>Total Terbayar</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#38a169' }}>
                Rp {totalTerbayar.toLocaleString('id-ID')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#718096' }}>Sisa Tagihan</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#d69e2e' }}>
                Rp {sisaTarget.toLocaleString('id-ID')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#718096' }}>Tunggakan Setelah Bayar</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e53e3e' }}>
                Rp {tunggakan.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Form Pembayaran */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                Jumlah Bayar
              </label>
              <input 
                type="number" 
                value={bayar}
                onChange={e => setBayar(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 6, 
                  border: '1px solid #cbd5e0', 
                  width: '100%',
                  fontSize: 14
                }}
                placeholder="Masukkan jumlah bayar"
              />
            </div>

            <div style={{ minWidth: 150 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                Metode Pembayaran
              </label>
              <select 
                value={metode}
                onChange={e => {
                  setMetode(e.target.value);
                  // Reset checkbox jika bukan metode bantuan
                  if (!['kip', 'gnota', 'bksm'].includes(e.target.value.toLowerCase())) {
                    setGunakanBantuan(false);
                  }
                }}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 6, 
                  border: '1px solid #cbd5e0', 
                  width: '100%',
                  fontSize: 14
                }}
              >
                <option value="tunai">Tunai</option>
                <option value="transfer">Transfer Bank</option>
                <option value="kip">KIP</option>
                <option value="gnota">GNOTA</option>
                <option value="bksm">BKSM</option>
              </select>
            </div>

            {/* Checkbox untuk menggunakan saldo bantuan */}
            {siswaData && ['kip', 'gnota', 'bksm'].includes(metode.toLowerCase()) && 
             saldoBantuan[metode.toUpperCase()] && 
             saldoBantuan[metode.toUpperCase()].saldo_tersedia > 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '8px 12px',
                background: '#e6fffa',
                borderRadius: 6,
                border: '1px solid #81e6d9'
              }}>
                <input
                  type="checkbox"
                  checked={gunakanBantuan}
                  onChange={e => setGunakanBantuan(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label style={{ fontSize: 14, cursor: 'pointer', color: '#234e52' }}>
                  Gunakan Saldo {metode.toUpperCase()} 
                  (Tersedia: Rp {saldoBantuan[metode.toUpperCase()].saldo_tersedia.toLocaleString('id-ID')})
                </label>
              </div>
            )}

            <button 
              style={{ 
                padding: '8px 32px', 
                borderRadius: 6, 
                background: loading ? '#cbd5e0' : '#38a169', 
                color: '#fff', 
                border: 'none', 
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
              onClick={handleBayar}
              disabled={loading || !siswaData || bayar <= 0}
            >
              {loading ? 'Memproses...' : 'Bayar'}
            </button>

            <button 
              style={{ 
                padding: '8px 32px', 
                borderRadius: 6, 
                background: '#e53e3e', 
                color: '#fff', 
                border: 'none', 
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14
              }}
              onClick={handleBatal}
            >
              Batal
            </button>
          </div>

          {/* Info Pembayaran */}
          {selectedTagihan.length > 0 && (
            <div style={{ 
              marginTop: 16, 
              padding: 12, 
              background: '#edf2f7', 
              borderRadius: 6,
              fontSize: 14
            }}>
              <strong>Catatan:</strong> {selectedTagihan.length} tagihan dipilih. 
              Pembayaran akan didistribusikan secara otomatis ke tagihan yang dipilih.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const thStyle = { 
  padding: '12px', 
  border: '1px solid #e2e8f0', 
  textAlign: 'left', 
  fontWeight: 600,
  background: '#f7fafc'
};

const tdStyle = { 
  padding: '12px', 
  border: '1px solid #e2e8f0' 
};


export default TransaksiPembayaranSiswa;
