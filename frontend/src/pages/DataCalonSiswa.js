import React, { useState, useEffect } from 'react';
import FormCalonSiswa from '../components/FormCalonSiswa';

const DataCalonSiswa = () => {
  const [data, setData] = useState([]);
  const [filterNama, setFilterNama] = useState('');
  const [filterGelombang, setFilterGelombang] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCount, setSelectedCount] = useState(0);

  // Fungsi untuk mendapatkan ID berikutnya - DIPERBAIKI
  const getNextId = () => {
    if (!data || data.length === 0) return 'CS-001';
    
    // Ekstrak hanya ID yang valid
    const validIds = data
      .map(item => item.id_calon_siswa)
      .filter(id => id && typeof id === 'string' && id.startsWith('CS-'));
    
    if (validIds.length === 0) return 'CS-001';
    
    // Dapatkan angka tertinggi dari ID yang ada
    const maxId = Math.max(...validIds.map(id => {
      const numPart = id.replace('CS-', '');
      const num = parseInt(numPart, 10);
      return isNaN(num) ? 0 : num;
    }));
    
    return `CS-${String(maxId + 1).padStart(3, '0')}`;
  };

  // Fungsi untuk menangani upload data ke data siswa - DIPERBAIKI dengan auto kelas X
  const handleUpload = async (id) => {
    try {
      // Cari data calon siswa yang akan diupload
      const calonSiswa = data.find(item => item.id_calon_siswa === id);
      
      if (!calonSiswa) {
        alert('Data calon siswa tidak ditemukan!');
        return;
      }
      
      // Kirim data ke endpoint data siswa
      const response = await fetch(`http://localhost:5000/api/calon-siswa/upload/${id}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Mapping field dari calon_siswa ke siswa
          nama: calonSiswa.nama,
          tempat_lahir: calonSiswa.tempat_lahir,
          tgl_lahir: calonSiswa.tgl_lahir,
          alamat: calonSiswa.alamat,
          no_telp: calonSiswa.no_telp,
          agama: calonSiswa.agama,
          jenis_kelamin: calonSiswa.jenis_kelamin,
          nama_ortu: calonSiswa.nama_ortu,
          jurusan_id: calonSiswa.jurusan_id,
          kelas_id: 1, // Otomatis masuk ke kelas X
          status: 1, // Status aktif sebagai siswa
          tgl_daftar: calonSiswa.tgl_daftar || new Date().toISOString().split('T')[0],
          desa: calonSiswa.desa,           // <-- Tambahkan ini
          kecamatan: calonSiswa.kecamatan, // <-- Tambahkan ini
          kabupaten: calonSiswa.kabupaten  // <-- Tambahkan ini
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const newSiswaData = await response.json();
      console.log('Data siswa baru:', newSiswaData);

      // Hapus data dari calon siswa setelah berhasil diupload
      const deleteResponse = await fetch(`http://localhost:5000/api/calon-siswa/${id}`, {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) {
        console.warn('Data berhasil diupload ke siswa tetapi gagal dihapus dari calon siswa');
      }
      
      alert('Data berhasil diupload ke data siswa dan otomatis masuk kelas X!');
      fetchData(); // Refresh data
      
      // Jika ada komponen DataSiswa yang terdaftar di window, panggil fungsi refresh-nya
      if (window.refreshDataSiswa) {
        window.refreshDataSiswa(newSiswaData.id_siswa || id);
      }
    } catch (err) {
      console.error('Error uploading data:', err);
      alert('Gagal mengupload data ke data siswa: ' + err.message);
    }
  };

  // Fungsi untuk menangani upload batch - DIPERBAIKI dengan auto kelas X
  const handleBatchUpload = async () => {
    const selectedItems = data.filter(item => item.isSelected);
    
    if (selectedItems.length === 0) {
      alert('Silakan pilih data yang akan diupload terlebih dahulu!');
      return;
    }
    
    if (!window.confirm(`Apakah Anda yakin ingin mengupload ${selectedItems.length} data ke data siswa?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const uploadResults = [];
      
      for (const item of selectedItems) {
        // Upload ke data siswa
        const uploadResponse = await fetch('http://localhost:5000/api/siswa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama: item.nama,
            tempat_lahir: item.tempat_lahir,
            tgl_lahir: item.tgl_lahir,
            alamat: item.alamat,
            no_telp: item.no_telp,
            agama: item.agama,
            jenis_kelamin: item.jenis_kelamin,
            nama_ortu: item.nama_ortu,
            jurusan_id: item.jurusan_id,
            kelas_id: 1, // Otomatis masuk ke kelas X
            status: 1,
            tgl_daftar: item.tgl_daftar || new Date().toISOString().split('T')[0],
            desa: item.desa,           // <-- Tambahkan ini
            kecamatan: item.kecamatan, // <-- Tambahkan ini
            kabupaten: item.kabupaten  // <-- Tambahkan ini
          })
        });
        
        if (uploadResponse.ok) {
          // Hapus dari calon siswa jika berhasil diupload
          const deleteResponse = await fetch(`http://localhost:5000/api/calon-siswa/${item.id_calon_siswa}`, {
            method: 'DELETE'
          });
          
          if (deleteResponse.ok) {
            uploadResults.push({ success: true, id: item.id_calon_siswa });
          } else {
            uploadResults.push({ success: false, id: item.id_calon_siswa, error: 'Gagal menghapus dari calon siswa' });
          }
        } else {
          uploadResults.push({ success: false, id: item.id_calon_siswa, error: 'Gagal upload ke data siswa' });
        }
      }
      
      const successfulUploads = uploadResults.filter(result => result.success).length;
      
      if (successfulUploads === selectedItems.length) {
        alert(`${successfulUploads} data berhasil diupload ke data siswa dan otomatis masuk kelas X!`);
      } else {
        alert(`${successfulUploads} dari ${selectedItems.length} data berhasil diupload. Beberapa data gagal diupload.`);
      }
      
      fetchData();
    } catch (err) {
      console.error('Error batch uploading data:', err);
      alert('Gagal mengupload data ke data siswa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const jurusanLabel = (jurusan_id) => {
    if (jurusan_id === 1) return 'TG';
    if (jurusan_id === 2) return 'RPL';
    return '-';
  };

  // Fungsi untuk mendapatkan tahun unik dari data
  const getUniqueYears = () => {
    const years = new Set();
    data.forEach(row => {
      if (row.tgl_daftar) {
        const year = new Date(row.tgl_daftar).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/calon-siswa');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json();
      
      if (Array.isArray(json)) {
        setData(json);
      } else if (json && Array.isArray(json.data)) {
        setData(json.data);
      } else {
        console.warn('Data tidak dalam format array yang diharapkan:', json);
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal mengambil data dari server');
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update selected count ketika data berubah
  useEffect(() => {
    const count = data.filter(item => item.isSelected).length;
    setSelectedCount(count);
  }, [data]);

  // Filter data
  const filteredData = Array.isArray(data) ? data.filter((row) => {
    const matchNama = row.nama?.toLowerCase().includes(filterNama.toLowerCase());
    const matchGelombang = filterGelombang ? row.gelombang === Number(filterGelombang) : true;
    const matchTahun = filterTahun ? 
      row.tgl_daftar && new Date(row.tgl_daftar).getFullYear() === Number(filterTahun) : 
      true;
    
    return matchNama && matchGelombang && matchTahun;
  }) : [];

  const today = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };

  const handleSubmit = async (formData) => {
    try {
      // Generate ID baru untuk calon siswa
      const newId = getNextId();
      
      const response = await fetch('http://localhost:5000/api/calon-siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id_calon_siswa: newId,
          jurusan_id: Number(formData.jurusan),
          gelombang: Number(formData.gelombang),
          status: 0, // Status 0 untuk calon siswa
          biaya_pendaftaran: Number(formData.biaya_pendaftaran) || 0
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Tutup form dan refresh data calon siswa saja
      setShowForm(false);
      fetchData();
      alert('Data calon siswa berhasil disimpan!');
      
    } catch (err) {
      console.error('Error saving data:', err);
      alert('Gagal menyimpan data!');
    }
  };

  if (loading && data.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="spinner"></div>
        <div>Memuat data calon siswa...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>
        <button onClick={fetchData} style={{ padding: '10px 20px', background: '#4ea8de', color: 'white', border: 'none', borderRadius: '6px' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  const uniqueYears = getUniqueYears();
  const currentYear = new Date().getFullYear();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#1e3a8a' }}>Data Calon Siswa</div>
          <div style={{ color: '#666', fontWeight: '500', fontSize: '16px' }}>Kelola data calon siswa SMK Palapa</div>
        </div>
        <button style={{ 
          background: '#4ea8de', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '8px', 
          padding: '12px 20px', 
          fontWeight: '600', 
          fontSize: '14px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
          onMouseOver={(e) => e.target.style.background = '#3b82f6'}
          onMouseOut={(e) => e.target.style.background = '#4ea8de'}
          onClick={() => setShowForm(true)}>
          + Tambah Data
        </button>
      </div>
      
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '16px', color: '#333' }}>Filter Data</div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari nama calon siswa..."
            value={filterNama}
            onChange={e => setFilterNama(e.target.value)}
            style={{ flex: 2, padding: '12px', borderRadius: '8px', border: '1px solid #e1e5e9', fontSize: '14px' }}
          />
          <select value={filterGelombang} onChange={e => setFilterGelombang(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e1e5e9', fontSize: '14px' }}>
            <option value="">Semua Gelombang</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
          <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e1e5e9', fontSize: '14px' }}>
            <option value="">Semua Tahun</option>
            {uniqueYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
            {!uniqueYears.includes(currentYear) && (
              <option value={currentYear}>{currentYear}</option>
            )}
          </select>
        </div>
      </div>

      {selectedCount > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <button 
            onClick={handleBatchUpload}
            disabled={loading}
            style={{ 
              background: loading ? '#9ca3af' : '#10b981', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '10px 16px', 
              fontWeight: '600', 
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Memproses...' : `Upload ${selectedCount} Data Terpilih ke Data Siswa (Kelas X)`}
          </button>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setData(data.map(item => ({...item, isSelected: checked})));
                    }}
                  />
                </th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>ID</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Nama</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Gelombang</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Tanggal</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '##333' }}>Jurusan</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#666' }}>Memuat data...</td></tr>
              )}
              {!loading && filteredData.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#666' }}>Tidak ada data calon siswa</td></tr>
              )}
              {!loading && filteredData.map(row => (
                <tr key={row.id_calon_siswa} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={row.isSelected || false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setData(data.map(item => 
                          item.id_calon_siswa === row.id_calon_siswa 
                            ? {...item, isSelected: checked} 
                            : item
                        ));
                      }}
                    />
                  </td>
                  <td style={{ padding: '16px', fontWeight: '500' }}>{row.id_calon_siswa || '-'}</td>
                  <td style={{ padding: '16px' }}>{row.nama || '-'}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>{row.gelombang || '-'}</td>
                  <td style={{ padding: '16px' }}>{row.tgl_daftar ? new Date(row.tgl_daftar).toLocaleDateString('id-ID') : '-'}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>{jurusanLabel(row.jurusan_id)}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleUpload(row.id_calon_siswa)}
                      style={{ 
                        background: '#10b981', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '6px', 
                        padding: '8px 12px', 
                        fontWeight: '500', 
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      title="Upload ke Data Siswa (Kelas X)"
                    >
                      Upload
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {showForm && (
        <FormCalonSiswa
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
          initialId={getNextId()}
          initialTglDaftar={today()}
        />
      )}

      <style>
        {`
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default DataCalonSiswa;