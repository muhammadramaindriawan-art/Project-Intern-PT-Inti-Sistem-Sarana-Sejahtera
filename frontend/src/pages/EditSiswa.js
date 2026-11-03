import React, { useState, useEffect } from 'react';

const EditSiswa = ({ id, onBack, onCancel }) => {
  const [formData, setFormData] = useState({
    nama: '',
    jenis_kelamin: '',
    tempat_lahir: '',
    tgl_lahir: '',
    no_telp: '',
    agama: '',
    jurusan_id: '',
    kelas_id: '',
    tgl_daftar: '', // gunakan tgl_daftar
    alamat: '',
    status: '',
    nama_ortu: '',
    informasi_tambahan: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [id]);

  const fetchData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/siswa/${id}`);
      if (!response.ok) {
        throw new Error('Data tidak ditemukan');
      }
      const data = await response.json();
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      setFormData({
        nama: data.nama || '',
        jenis_kelamin: data.jenis_kelamin || '',
        tempat_lahir: data.tempat_lahir || '',
        tgl_lahir: formatDate(data.tgl_lahir),
        no_telp: data.no_telp || '',
        agama: data.agama || '',
        jurusan_id: data.jurusan_id || '',
        kelas_id: data.kelas_id || '',
        tgl_daftar: formatDate(data.tgl_daftar), // gunakan tgl_daftar
        alamat: data.alamat || '',
        status: data.status !== undefined ? data.status : '',
        nama_ortu: data.nama_ortu || '',
        informasi_tambahan: data.informasi_tambahan || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSend = { ...formData }; // langsung kirim tgl_daftar

      const response = await fetch(`http://localhost:5000/api/siswa/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan data');
      }

      alert('Data berhasil disimpan');
      onBack();
    } catch (err) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
        <div style={{ fontSize: '18px', color: '#64748b', fontWeight: '500' }}>Memuat data siswa...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !formData.nama) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: '#ef4444' }}>⚠️</div>
        <div style={{ color: '#ef4444', fontSize: '18px', fontWeight: '600', marginBottom: '24px', maxWidth: '400px' }}>
          {error || 'Data tidak ditemukan'}
        </div>
        <button 
          onClick={onCancel || onBack} 
          style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'background-color 0.2s' }}
          onMouseOver={(e) => e.target.style.background = '#2563eb'}
          onMouseOut={(e) => e.target.style.background = '#3b82f6'}
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#1f2937' }}>
            Edit Data Siswa
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
            Perbarui informasi siswa SMK Palapa
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid #d1d5db', color: '#374151', cursor: 'pointer', fontSize: '14px', padding: '10px 16px', borderRadius: '8px', fontWeight: '500', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.target.style.background = '#f3f4f6'; e.target.style.borderColor = '#9ca3af'; }}
            onMouseOut={(e) => { e.target.style.background = 'none'; e.target.style.borderColor = '#d1d5db'; }}
          >
            <span>←</span>
            Kembali ke Detail
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {/* Nama */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
                Nama Lengkap *
              </label>
              <input 
                type="text" 
                name="nama" 
                value={formData.nama} 
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
              />
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
                Jenis Kelamin
              </label>
              <select 
                name="jenis_kelamin" 
                value={formData.jenis_kelamin} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', backgroundColor: '#fff' }}
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            {/* Tempat Lahir */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
                Tempat Lahir
              </label>
              <input 
                type="text" 
                name="tempat_lahir" 
                value={formData.tempat_lahir} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
              />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
                Tanggal Lahir
              </label>
              <input 
                type="date" 
                name="tgl_lahir" 
                value={formData.tgl_lahir} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
              />
            </div>

            {/* Jurusan */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
                Jurusan
              </label>
              <select 
                name="jurusan_id" 
                value={formData.jurusan_id} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', backgroundColor: '#fff' }}
              >
                <option value="">Pilih Jurusan</option>
                <option value="1">Teknik Grafika (TG)</option>
                <option value="2">Rekayasa Perangkat Lunak (RPL)</option>
              </select>
            </div>

            {/* Kelas */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
                Kelas
              </label>
              <select 
                name="kelas_id" 
                value={formData.kelas_id} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', backgroundColor: '#fff' }}
              >
                <option value="">Pilih Kelas</option>
                <option value="1">X (Sepuluh)</option>
                <option value="2">XI (Sebelas)</option>
                <option value="3">XII (Dua Belas)</option>
              </select>
            </div>

            {/* Nomor Telepon */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
                Nomor Telepon
              </label>
              <input 
                type="text" 
                name="no_telp" 
                value={formData.no_telp} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
              />
            </div>

            {/* Agama */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
                Agama
              </label>
              <input 
                type="text" 
                name="agama" 
                value={formData.agama} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
              />
            </div>

            {/* Tanggal Daftar */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
                Tanggal Daftar
              </label>
              <input 
                type="date" 
                name="tgl_daftar" 
                value={formData.tgl_daftar} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
              />
            </div>

            {/* Status */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
                Status
              </label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', backgroundColor: '#fff' }}
              >
                <option value="">Pilih Status</option>
                <option value="1">Aktif</option>
                <option value="0">Tidak Aktif</option>
              </select>
            </div>
          </div>

          {/* Alamat */}
          <div style={{ marginTop: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
              Alamat
            </label>
            <textarea 
              name="alamat" 
              value={formData.alamat} 
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Nama Orang Tua / Wali */}
          <div style={{ marginTop: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
              Nama Orang Tua / Wali
            </label>
            <input 
              type="text" 
              name="nama_ortu" 
              value={formData.nama_ortu} 
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
            />
          </div>

          {/* Informasi Tambahan */}
          <div style={{ marginTop: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>
              Informasi Tambahan
            </label>
            <textarea 
              name="informasi_tambahan" 
              value={formData.informasi_tambahan} 
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#1f2937', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Data tambahan dapat ditambahkan sesuai kebutuhan sekolah"
            />
          </div>
        </div>

        {/* Tombol Aksi */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button 
            type="button" 
            onClick={handleReset}
            disabled={saving}
            style={{ padding: '12px 24px', background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s', opacity: saving ? 0.6 : 1 }}
            onMouseOver={(e) => { if (!saving) { e.target.style.background = '#e5e7eb'; e.target.style.borderColor = '#9ca3af'; } }}
            onMouseOut={(e) => { if (!saving) { e.target.style.background = '#f3f4f6'; e.target.style.borderColor = '#d1d5db'; } }}
          >
            Reset
          </button>
          <button 
            type="submit"
            disabled={saving}
            style={{ padding: '12px 24px', background: saving ? '#9ca3af' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => { if (!saving) e.target.style.background = '#2563eb'; }}
            onMouseOut={(e) => { if (!saving) e.target.style.background = '#3b82f6'; }}
          >
            {saving ? 'Menyimpan...' : 'Simpan Data'}
          </button>
        </div>
      </form>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default EditSiswa;