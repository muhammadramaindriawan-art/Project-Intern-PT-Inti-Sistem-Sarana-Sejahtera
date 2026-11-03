import React, { useState } from 'react';

const initialState = {
  nama: '',
  gelombang: '',
  jurusan: '',
  tempat_lahir: '',
  tgl_lahir: '',
  alamat: '',
  id_calon_siswa: '',
  tgl_daftar: '',
  no_telp: '',
  agama: '',
  jenis_kelamin: '',
  nama_ortu: '',
  no_telp_rumah: '',
  desa: '',
  kecamatan: '',
  kabupaten: '',
  alamat_tinggal: '',
  biaya_pendaftaran: '',
};

const jurusanOptions = [
  { value: '', label: 'Pilih Jurusan' },
  { value: '1', label: 'TG - Teknik Grafika' },
  { value: '2', label: 'RPL - Rekayasa Perangkat Lunak' },
];

const gelombangOptions = [
  { value: '', label: 'Pilih Gelombang' },
  { value: '1', label: 'Gelombang 1' },
  { value: '2', label: 'Gelombang 2' },
  { value: '3', label: 'Gelombang 3' },
];

const agamaOptions = [
  { value: '', label: 'Pilih Agama' },
  { value: 'Islam', label: 'Islam' },
  { value: 'Kristen', label: 'Kristen' },
  { value: 'Katolik', label: 'Katolik' },
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Buddha', label: 'Buddha' },
  { value: 'Konghucu', label: 'Konghucu' },
];

const jenisKelaminOptions = [
  { value: '', label: 'Pilih Jenis Kelamin' },
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
];

const FormCalonSiswa = ({ onClose, onSubmit, initialId, initialTglDaftar }) => {
  const [form, setForm] = useState({
    ...initialState,
    id_calon_siswa: initialId || '',
    tgl_daftar: initialTglDaftar || '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.nama) newErrors.nama = 'Nama lengkap harus diisi';
    if (!form.tempat_lahir) newErrors.tempat_lahir = 'Tempat lahir harus diisi';
    if (!form.tgl_lahir) newErrors.tgl_lahir = 'Tanggal lahir harus diisi';
    if (!form.no_telp) newErrors.no_telp = 'Nomor telepon harus diisi';
    if (!form.agama) newErrors.agama = 'Agama harus dipilih';
    if (!form.jenis_kelamin) newErrors.jenis_kelamin = 'Jenis kelamin harus dipilih';
    if (!form.nama_ortu) newErrors.nama_ortu = 'Nama orang tua harus diisi';
    if (!form.desa) newErrors.desa = 'Desa harus diisi';
    if (!form.kecamatan) newErrors.kecamatan = 'Kecamatan harus diisi';
    if (!form.kabupaten) newErrors.kabupaten = 'Kabupaten harus diisi';
    if (!form.alamat) newErrors.alamat = 'Alamat harus diisi';
    if (!form.gelombang) newErrors.gelombang = 'Gelombang harus dipilih';
    if (!form.jurusan) newErrors.jurusan = 'Jurusan harus dipilih';
    if (!form.biaya_pendaftaran) newErrors.biaya_pendaftaran = 'Biaya pendaftaran harus diisi';
    
    if (form.no_telp && !/^[0-9+\-\s()]{10,15}$/.test(form.no_telp)) {
      newErrors.no_telp = 'Format nomor telepon tidak valid';
    }
    
    if (form.no_telp_rumah && !/^[0-9+\-\s()]{10,15}$/.test(form.no_telp_rumah)) {
      newErrors.no_telp_rumah = 'Format nomor telepon rumah tidak valid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();
    
    if (validateForm()) {
      const formattedData = {
        ...form,
        gelombang: Number(form.gelombang),
        jurusan_id: Number(form.jurusan),
        biaya_pendaftaran: Number(form.biaya_pendaftaran) || 0,
        status: 0 
      };
      
      onSubmit(formattedData);
    }
  };

  const handleReset = () => {
    setForm({ ...initialState, id_calon_siswa: initialId || '', tgl_daftar: initialTglDaftar || '' });
    setErrors({});
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="header-content">
            <button 
              onClick={onClose} 
              className="back-button"
              aria-label="Kembali"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Kembali
            </button>
            <h2 className="modal-title">Tambah Data Calon Siswa</h2>
          </div>
          <button 
            onClick={onClose} 
            className="close-button"
            aria-label="Tutup"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-section">
            <h3 className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Informasi Pribadi
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  name="nama"
                  type="text"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className={`form-input ${errors.nama ? 'error' : ''}`}
                  required
                />
                {errors.nama && <span className="error-message">{errors.nama}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Tempat Lahir</label>
                <input
                  name="tempat_lahir"
                  type="text"
                  value={form.tempat_lahir}
                  onChange={handleChange}
                  placeholder="Masukkan tempat lahir"
                  className={`form-input ${errors.tempat_lahir ? 'error' : ''}`}
                  required
                />
                {errors.tempat_lahir && <span className="error-message">{errors.tempat_lahir}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Lahir</label>
                <div className="date-input-wrapper">
                  <input
                    name="tgl_lahir"
                    type="date"
                    value={form.tgl_lahir}
                    onChange={handleChange}
                    className={`form-input date-input ${errors.tgl_lahir ? 'error' : ''}`}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {errors.tgl_lahir && <span className="error-message">{errors.tgl_lahir}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Telepon (HP)</label>
                <input
                  name="no_telp"
                  type="tel"
                  value={form.no_telp}
                  onChange={handleChange}
                  placeholder="Contoh: 081234567890"
                  className={`form-input ${errors.no_telp ? 'error' : ''}`}
                  required
                />
                {errors.no_telp && <span className="error-message">{errors.no_telp}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Telepon Rumah</label>
                <input
                  name="no_telp_rumah"
                  type="tel"
                  value={form.no_telp_rumah}
                  onChange={handleChange}
                  placeholder="Contoh: 0218765432"
                  className={`form-input ${errors.no_telp_rumah ? 'error' : ''}`}
                />
                {errors.no_telp_rumah && <span className="error-message">{errors.no_telp_rumah}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Agama</label>
                <select
                  name="agama"
                  value={form.agama}
                  onChange={handleChange}
                  className={`form-select ${errors.agama ? 'error' : ''}`}
                  required
                >
                  {agamaOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.agama && <span className="error-message">{errors.agama}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Jenis Kelamin</label>
                <select
                  name="jenis_kelamin"
                  value={form.jenis_kelamin}
                  onChange={handleChange}
                  className={`form-select ${errors.jenis_kelamin ? 'error' : ''}`}
                  required
                >
                  {jenisKelaminOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.jenis_kelamin && <span className="error-message">{errors.jenis_kelamin}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Nama Orang Tua/Wali</label>
                <input
                  name="nama_ortu"
                  type="text"
                  value={form.nama_ortu}
                  onChange={handleChange}
                  placeholder="Masukkan nama orang tua/wali"
                  className={`form-input ${errors.nama_ortu ? 'error' : ''}`}
                  required
                />
                {errors.nama_ortu && <span className="error-message">{errors.nama_ortu}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Desa</label>
                <input
                  name="desa"
                  type="text"
                  value={form.desa}
                  onChange={handleChange}
                  placeholder="Masukkan nama desa"
                  className={`form-input ${errors.desa ? 'error' : ''}`}
                  required
                />
                {errors.desa && <span className="error-message">{errors.desa}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Kecamatan</label>
                <input
                  name="kecamatan"
                  type="text"
                  value={form.kecamatan}
                  onChange={handleChange}
                  placeholder="Masukkan nama kecamatan"
                  className={`form-input ${errors.kecamatan ? 'error' : ''}`}
                  required
                />
                {errors.kecamatan && <span className="error-message">{errors.kecamatan}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Kabupaten</label>
                <input
                  name="kabupaten"
                  type="text"
                  value={form.kabupaten}
                  onChange={handleChange}
                  placeholder="Masukkan nama kabupaten"
                  className={`form-input ${errors.kabupaten ? 'error' : ''}`}
                  required
                />
                {errors.kabupaten && <span className="error-message">{errors.kabupaten}</span>}
              </div>

              <div className="form-group full-width">
                <label className="form-label">Alamat Lengkap</label>
                <textarea
                  name="alamat"
                  value={form.alamat}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lengkap (jalan, RT/RW, dll)"
                  className={`form-textarea ${errors.alamat ? 'error' : ''}`}
                  rows="3"
                  required
                />
                {errors.alamat && <span className="error-message">{errors.alamat}</span>}
              </div>
              
              <div className="form-group full-width">
                <label className="form-label">Alamat Tinggal (jika berbeda)</label>
                <textarea
                  name="alamat_tinggal"
                  value={form.alamat_tinggal}
                  onChange={handleChange}
                  placeholder="Masukkan alamat tinggal jika berbeda dengan alamat di atas"
                  className="form-textarea"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              Informasi Akademik
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Gelombang Pendaftaran</label>
                <select
                  name="gelombang"
                  value={form.gelombang}
                  onChange={handleChange}
                  className={`form-select ${errors.gelombang ? 'error' : ''}`}
                  required
                >
                  {gelombangOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.gelombang && <span className="error-message">{errors.gelombang}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Jurusan</label>
                <select
                  name="jurusan"
                  value={form.jurusan}
                  onChange={handleChange}
                  className={`form-select ${errors.jurusan
 ? 'error' : ''}`}
                  required
                >
                  {jurusanOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.jurusan && <span className="error-message">{errors.jurusan}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Biaya Pendaftaran (Rp) <span className="required"></span>
                </label>
                <input
                  name="biaya_pendaftaran"
                  type="number"
                  value={form.biaya_pendaftaran}
                  onChange={handleChange}
                  placeholder="Contoh: 250000"
                  className={`form-input ${errors.biaya_pendaftaran ? 'error' : ''}`}
                  min="0"
                  required
                />
                {errors.biaya_pendaftaran && <span className="error-message">{errors.biaya_pendaftaran}</span>}
              </div>
            </div>
          </div>

          {/* System Information Section */}
          <div className="form-section">
            <h3 className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-2-.4-2.8-1.2L12 2 5.8 10.8C5 11.6 4 12 3 12"/>
              </svg>
              Informasi Sistem
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">ID Calon Siswa</label>
                <input
                  name="id_calon_siswa"
                  value={form.id_calon_siswa}
                  readOnly
                  className="form-input readonly"
                />
                <small className="form-help">ID otomatis dibuat sistem</small>
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Pendaftaran</label>
                <input
                  name="tgl_daftar"
                  type="date"
                  value={form.tgl_daftar}
                  readOnly
                  className="form-input readonly"
                />
                <small className="form-help">Tanggal otomatis sesuai hari ini</small>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Reset Form
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
              </svg>
              Simpan Data
            </button>
          </div>
        </form>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .modal-container {
            background: #ffffff;
            border-radius: 0;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            max-width: 700px;
            width: 100%;
            max-height: 85vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease-out;
            margin-top: 80px;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 24px 32px 0 32px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 0;
          }

          .header-content {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .back-button {
            display: flex;
            align-items: center;
            gap: 8px;
            background: none;
            border: none;
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 0;
            transition: all 0.2s ease;
          }

          .back-button:hover {
            background: #f3f4f6;
            color: #374151;
          }

          .close-button {
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            padding: 8px;
            border-radius: 0;
            transition: all 0.2s ease;
          }

          .close-button:hover {
            background: #f3f4f6;
            color: #6b7280;
          }

          .modal-title {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            letter-spacing: -0.025em;
          }

          .form-content {
            padding: 24px;
            margin-top: 0;
          }

          .form-section {
            margin-bottom: 24px;
          }

          .form-section:first-child {
            margin-top: 0;
          }

          .section-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            margin: 0 0 16px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }

          .section-title svg {
            color: #4ea8de;
          }

          .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
          }

          .form-group.full-width {
            grid-column: 1 / -1;
          }

          .form-label {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .required {
            color: #ef4444;
            font-weight: 700;
          }

          .form-input,
          .form-select,
          .form-textarea {
            padding: 10px 14px;
            border: 2px solid #e5e7eb;
            border-radius: 0;
            font-size: 14px;
            transition: all 0.2s ease;
            background: #ffffff;
            color: #111827;
          }

          .form-input:focus,
          .form-select:focus,
          .form-textarea:focus {
            outline: none;
            border-color: #4ea8de;
            box-shadow: 0 0 0 3px rgba(78, 168, 222, 0.1);
          }

          .form-input.readonly {
            background: #f9fafb;
            color: #6b7280;
            cursor: not-allowed;
          }

          .form-input.error,
          .form-select.error,
          .form-textarea.error {
            border-color: #ef4444;
          }

          .error-message {
            color: #ef4444;
            font-size: 12px;
            margin-top: 4px;
          }

          .form-textarea {
            resize: vertical;
            min-height: 80px;
            font-family: inherit;
          }

          .date-input-wrapper {
            position: relative;
          }

          .date-input {
            padding-right: 40px;
          }

          .calendar-icon {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
            pointer-events: none;
          }

          .form-help {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
            font-style: italic;
          }

          .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 16px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            margin-top: 24px;
          }

          .btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border: none;
            border-radius: 0;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
          }

          .btn-primary {
            background: linear-gradient(135deg, #4ea8de 0%, #3b82f6 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(78, 168, 222, 0.3);
          }

          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(78, 168, 222, 0.4);
          }

          .btn-secondary {
            background: #ffffff;
            color: #6b7280;
            border: 2px solid #e5e7eb;
          }

          .btn-secondary:hover {
            background: #f9fafb;
            color: #374151;
            border-color: #d1d5db;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .modal-container {
              margin: 20px;
              margin-top: 60px;
              max-height: calc(100vh - 40px);
            }

            .modal-header,
            .form-content {
              padding: 20px;
            }

            .form-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }

            .form-actions {
              flex-direction: column;
            }

            .btn {
              width: 100%;
              justify-content: center;
            }
          }

          @media (max-width: 480px) {
            .modal-title {
              font-size: 20px;
            }

            .section-title {
              font-size: 16px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default FormCalonSiswa;