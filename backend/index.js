const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Database connection configuration
const pool = new Pool(
  process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pendaftaran',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456'
  }
);

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// JWT Secret (dalam production, gunakan environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'smk-palapa-secret-key-2024';

// Email Configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'smkpalapa.pare@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password-here'
    }
  });
};

// Send OTP Email with Dynamic Sender
const sendOTPEmail = async (email, otp, isResend = false, customSender = null) => {
  try {
    let transporter;
    let fromEmail;
    
    if (customSender) {
      // Use custom sender configuration
      transporter = nodemailer.createTransport({
        service: customSender.service || 'gmail',
        auth: {
          user: customSender.email,
          pass: customSender.password
        }
      });
      fromEmail = `${customSender.name || 'SMK Palapa Pare'} <${customSender.email}>`;
    } else {
      // Use default configuration from .env
      transporter = createTransporter();
      fromEmail = process.env.EMAIL_FROM || 'SMK Palapa Pare <smkpalapa.pare@gmail.com>';
    }
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: isResend ? 'Kode OTP Baru - SMK Palapa Pare' : 'Verifikasi Email - SMK Palapa Pare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4ea8de 0%, #3b82f6 100%); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SMK PALAPA PARE</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
              ${isResend ? 'Kode OTP Baru' : 'Verifikasi Email Anda'}
            </p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin-bottom: 20px; text-align: center;">
              ${isResend ? 'Kode OTP Baru Telah Dikirim' : 'Selamat Datang di SMK Palapa Pare'}
            </h2>
            
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              ${isResend 
                ? 'Kode OTP baru telah dikirim ke email Anda. Gunakan kode berikut untuk verifikasi:'
                : 'Terima kasih telah mendaftar di SMK Palapa Pare. Untuk menyelesaikan pendaftaran, masukkan kode OTP berikut:'
              }
            </p>
            
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 30px; text-align: center; border-radius: 12px; border: 2px solid #e2e8f0;">
              <h1 style="color: #4ea8de; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold; font-family: 'Courier New', monospace;">${otp}</h1>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 25px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px; text-align: center;">
                <strong>⚠️ Penting:</strong> Kode ini berlaku selama <strong>5 menit</strong> dan hanya dapat digunakan sekali.
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Jika Anda tidak meminta kode ini, abaikan email ini. Kode akan otomatis kadaluarsa dalam 5 menit.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <div style="text-align: center; color: #64748b; font-size: 12px;">
              <p style="margin: 5px 0;">© 2024 SMK Palapa Pare. All rights reserved.</p>
              <p style="margin: 5px 0;">Jl. Raya Pare, Kediri, Jawa Timur</p>
            </div>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email OTP sent successfully to ${email}:`, info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

// In-memory storage untuk OTP (dalam production, gunakan Redis atau database)
const otpStore = new Map();

// Generate OTP 6 digit
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Simpan OTP dengan expiry time (5 menit)
const saveOTP = (email, otp) => {
  const expiry = Date.now() + (5 * 60 * 1000); // 5 menit
  otpStore.set(email, { otp, expiry });
};

// Verifikasi OTP
const verifyOTP = (email, otp) => {
  const stored = otpStore.get(email);
  if (!stored) return false;
  
  if (Date.now() > stored.expiry) {
    otpStore.delete(email);
    return false;
  }
  
  if (stored.otp === otp) {
    otpStore.delete(email);
    return true;
  }
  
  return false;
};

// Middleware untuk verifikasi JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    console.log('Register request received:', { username, email, firstName, lastName });

    // Validasi input
    if (!username || !email || !password || !firstName || !lastName) {
      console.log('Validation failed: missing fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Cek apakah username atau email sudah ada
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      console.log('User already exists:', { username, email });
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user baru dengan status pending dan role admin
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, 'admin', false) RETURNING id, username, email, first_name, last_name, role`,
      [username, email, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];
    console.log('User created successfully:', { id: user.id, username: user.username });

    // Generate OTP
    const otp = generateOTP();
    saveOTP(email, otp);

    // Kirim OTP via email
    const emailSent = await sendOTPEmail(email, otp, false);
    
    if (!emailSent) {
      console.log('Failed to send email, showing OTP in console for testing');
      console.log(`OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      message: emailSent 
        ? 'User registered successfully. Please check your email for OTP verification.'
        : 'User registered successfully. Please check console for OTP (email service not configured).',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: false
      },
      requiresVerification: true,
      emailSent: emailSent
    });

  } catch (err) {
    console.error('Register error details:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Verifikasi OTP
    if (!verifyOTP(email, otp)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Aktifkan user dan set role admin
    const result = await pool.query(
      'UPDATE users SET is_active = true, role = \'admin\' WHERE email = $1 RETURNING id, username, email, first_name, last_name, role',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Tidak generate JWT token - user harus login manual
    res.json({
      message: 'Email verified successfully. Please login with your credentials.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: true
      }
    });

  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resend OTP endpoint
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Cek apakah user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP baru
    const otp = generateOTP();
    saveOTP(email, otp);

    // Kirim OTP baru via email
    const emailSent = await sendOTPEmail(email, otp, true);
    
    if (!emailSent) {
      console.log('Failed to send email, showing OTP in console for testing');
      console.log(`New OTP for ${email}: ${otp}`);
    }

    res.json({
      message: emailSent 
        ? 'OTP sent successfully to your email'
        : 'OTP sent successfully (check console for testing)',
      email: email,
      emailSent: emailSent
    });

  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Cari user berdasarkan email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Cek apakah user sudah terverifikasi
    if (!user.is_active) {
      // Generate OTP untuk verifikasi
      const otp = generateOTP();
      saveOTP(email, otp);

      // Kirim OTP via email
      const emailSent = await sendOTPEmail(email, otp, true);
      
      if (!emailSent) {
        console.log('Failed to send email, showing OTP in console for testing');
        console.log(`Login OTP for ${email}: ${otp}`);
      }

      return res.status(200).json({
        message: emailSent 
          ? 'Account not verified. Please check your email for OTP to continue.'
          : 'Account not verified. Please check console for OTP to continue.',
        requiresVerification: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: false
        },
        emailSent: emailSent
      });
    }

    // Update role ke admin dan generate JWT token
    const updateResult = await pool.query(
      'UPDATE users SET role = \'admin\' WHERE id = $1 RETURNING role',
      [user.id]
    );

    const updatedRole = updateResult.rows[0].role;

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: updatedRole 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: updatedRole,
        isActive: true
      },
      token
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      }
    });

  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cek dan buat tabel data_calon_siswa jika belum ada
app.get('/api/check-tables', async (req, res) => {
  try {
    // Cek apakah tabel users ada
    const usersTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const usersTableExists = usersTableCheck.rows[0].exists;
    
    if (!usersTableExists) {
      // Buat tabel users
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'user',
          is_active BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Buat tabel roles
      await pool.query(`
        CREATE TABLE roles (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          permissions JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Insert sample roles
      await pool.query(`
        INSERT INTO roles (name, description, permissions) VALUES
        ('admin', 'Administrator dengan akses penuh', '{"all": true}'),
        ('teacher', 'Guru dengan akses terbatas', '{"read": true, "write_student": true}'),
        ('student', 'Siswa dengan akses terbatas', '{"read_own": true}'),
        ('parent', 'Orang tua dengan akses terbatas', '{"read_own_child": true}')
        ON CONFLICT (name) DO NOTHING;
      `);
      
      // Insert admin user
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      await pool.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) VALUES
        ('admin', 'admin@smkpalapa.sch.id', $1, 'Administrator', 'SMK Palapa', 'admin', true)
        ON CONFLICT (username) DO NOTHING;
      `, [adminPasswordHash]);
    }

    // Cek apakah tabel jurusan ada
    const jurusanTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'jurusan'
      );
    `);
    
    const jurusanTableExists = jurusanTableCheck.rows[0].exists;
    
    if (!jurusanTableExists) {
      // Buat tabel jurusan
      await pool.query(`
        CREATE TABLE jurusan (
          id SERIAL PRIMARY KEY,
          nama_jurusan VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Insert sample jurusan
      await pool.query(`
        INSERT INTO jurusan (nama_jurusan) VALUES
        ('TEKNIK GRAFIKA'),
        ('TEKNIK KOMPUTER JARINGAN'),
        ('AKUNTANSI'),
        ('BISNIS DIGITAL')
        ON CONFLICT DO NOTHING;
      `);
    }

    // Cek apakah kolom sub_kelas ada di tabel data_siswa
    const subKelasCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'data_siswa' 
        AND column_name = 'sub_kelas'
      );
    `);
    
    if (!subKelasCheck.rows[0].exists) {
      // Tambahkan kolom sub_kelas
      await pool.query(`
        ALTER TABLE data_siswa 
        ADD COLUMN sub_kelas VARCHAR(10) DEFAULT NULL;
      `);
      console.log('Column sub_kelas added to data_siswa table');
    }
    
    // Ubah tipe data kelas_id menjadi VARCHAR jika masih INTEGER
    const kelasIdTypeCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'data_siswa' 
      AND column_name = 'kelas_id'
    `);
    
    if (kelasIdTypeCheck.rows.length > 0 && kelasIdTypeCheck.rows[0].data_type === 'integer') {
      await pool.query(`
        ALTER TABLE data_siswa 
        ALTER COLUMN kelas_id TYPE VARCHAR(5);
      `);
      console.log('Column kelas_id type changed to VARCHAR');
    }
    
    // Cek apakah tabel data_calon_siswa ada
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'data_calon_siswa'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      // Buat tabel data_calon_siswa
      await pool.query(`
        CREATE TABLE data_calon_siswa (
          id_calon_siswa SERIAL PRIMARY KEY,
          nama VARCHAR(100) NOT NULL,
          gelombang INTEGER NOT NULL,
          tgl_daftar DATE NOT NULL,
          jurusan_id INTEGER NOT NULL,
          status INTEGER DEFAULT 0,
          alamat TEXT,
          tempat_lahir VARCHAR(100),
          tgl_lahir DATE,
          no_telp VARCHAR(20),
          biaya_pendaftaran NUMERIC(10,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Insert sample data - PERBAIKAN: syntax error diperbaiki
      await pool.query(`
        INSERT INTO data_calon_siswa (nama, gelombang, tgl_daftar, jurusan_id, status, alamat, tempat_lahir, tgl_lahir, no_telp) VALUES
        ('Ahmad Rizki', 1, '2024-01-15', 1, 1, 'Jl. Merdeka No. 123', 'Pare', '2008-05-20', '081234567890'),
        ('Siti Nurhaliza', 1, '2024-01-16', 2, 2, 'Jl. Sudirman No. 45', 'Kediri', '2008-03-15', '081234567891'),
        ('Budi Santoso', 2, '2024-01-17', 1, 0, 'Jl. Gatot Subroto No. 67', 'Pare', '2008-07-10', '081234567892')
      `);
    }
    
    res.json({ 
      message: 'Tables checked successfully',
      users_exists: usersTableExists,
      jurusan_exists: jurusanTableExists,
      data_calon_siswa_exists: tableExists,
      created: !usersTableExists || !tableExists || !jurusanTableExists
    });
  } catch (err) {
    console.error('Error checking tables:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ambil semua data calon siswa (tanpa authentication untuk sementara)
app.get('/api/calon-siswa', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM data_calon_siswa ORDER BY id_calon_siswa DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching calon siswa:', err);
    res.status(500).json({ error: err.message });
  }
});

// Tambah data calon siswa (tanpa authentication untuk sementara)
app.post('/api/calon-siswa', async (req, res) => {
  try {
    // Ambil data dari body
    const {
      id_calon_siswa,
      nama,
      gelombang,
      jurusan_id,
      alamat,
      tempat_lahir,
      tgl_lahir,
      jenis_kelamin,
      agama,
      desa,
      kecamatan,
      kabupaten,
      alamat_tinggal,
      no_telp,
      no_telp_rumah,
      nama_ortu,
      biaya_pendaftaran,
      tgl_daftar,
      status
    } = req.body;

    // Simpan ke tabel calon siswa
    const result = await pool.query(
      `INSERT INTO data_calon_siswa
      (id_calon_siswa, nama, gelombang, jurusan_id, alamat, tempat_lahir, tgl_lahir, jenis_kelamin, agama, desa, kecamatan, kabupaten, alamat_tinggal, no_telp, no_telp_rumah, nama_ortu, biaya_pendaftaran, tgl_daftar, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *`,
      [
        id_calon_siswa, nama, gelombang, jurusan_id, alamat, tempat_lahir, tgl_lahir, jenis_kelamin, agama,
        desa, kecamatan, kabupaten, alamat_tinggal, no_telp, no_telp_rumah, nama_ortu, Number(biaya_pendaftaran), tgl_daftar, status
      ]
    );

    // Setelah berhasil, insert ke tabel pembayaran
    await pool.query(
      `INSERT INTO pembayaran
      (nama_siswa, kelas, jumlah_bayar, metode, tanggal, status, keterangan)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        nama, // nama_siswa
        'Calon Siswa', // kelas otomatis "Calon Siswa"
        biaya_pendaftaran, // jumlah_bayar
        'Tunai', // metode default
        (tgl_daftar || new Date().toISOString().slice(0,10)), // tanggal
        'Sukses', // status
        'Pembayaran biaya pendaftaran' // keterangan
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error saving calon siswa:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ambil data calon siswa berdasarkan ID
app.get('/api/calon-siswa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Hapus validasi angka!
    // if (!id || isNaN(id)) {
    //   return res.status(400).json({ error: 'ID harus berupa angka' });
    // }
    // Gunakan id string langsung
    const calonSiswaId = id;
    const result = await pool.query(
      'SELECT * FROM data_calon_siswa WHERE id_calon_siswa = $1',
      [calonSiswaId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching calon siswa by ID:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update data calon siswa berdasarkan ID
app.put('/api/calon-siswa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Hapus validasi angka!
    // if (!id || isNaN(id)) {
    //   return res.status(400).json({ error: 'ID harus berupa angka' });
    // }
    const calonSiswaId = id;
    const { nama, gelombang, tgl_daftar, jurusan_id, status, alamat, tempat_lahir, tgl_lahir, no_telp } = req.body;
    const result = await pool.query(
      "UPDATE data_calon_siswa SET nama = $1, gelombang = $2, tgl_daftar = $3, jurusan_id = $4, status = $5, alamat = $6, tempat_lahir = $7, tgl_lahir = $8, no_telp = $9 WHERE id_calon_siswa = $10 RETURNING *",
      [nama, gelombang, tgl_daftar, jurusan_id, status, alamat, tempat_lahir, tgl_lahir, no_telp, calonSiswaId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating calon siswa:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Hapus data calon siswa berdasarkan ID
app.delete('/api/calon-siswa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Hapus validasi angka!
    // if (!id || isNaN(id)) {
    //   return res.status(400).json({ error: 'ID harus berupa angka' });
    // }
    const calonSiswaId = id;
    const result = await pool.query(
      'DELETE FROM data_calon_siswa WHERE id_calon_siswa = $1 RETURNING *',
      [calonSiswaId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }
    res.json({ message: 'Data berhasil dihapus', deletedData: result.rows[0] });
  } catch (err) {
    console.error('Error deleting calon siswa:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Cek dan buat tabel data_siswa jika belum ada
app.get('/api/check-siswa-table', async (req, res) => {
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'data_siswa'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      await pool.query(`
        CREATE TABLE data_siswa (
          id_siswa SERIAL PRIMARY KEY,
          nama VARCHAR(100) NOT NULL,
          jenis_kelamin VARCHAR(10),
          tempat_lahir VARCHAR(100),
          tgl_lahir DATE,
          alamat TEXT,
          no_telp VARCHAR(20),
          agama VARCHAR(50),
          nama_ortu VARCHAR(100),
          jurusan_id INTEGER NOT NULL,
          kelas_id VARCHAR(5) DEFAULT 'X',
          sub_kelas VARCHAR(10) DEFAULT NULL,
          status INTEGER DEFAULT 1,
          tgl_daftar DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Insert sample data dengan format kelas baru
      await pool.query(`
        INSERT INTO data_siswa (nama, jenis_kelamin, tempat_lahir, tgl_lahir, alamat, jurusan_id, kelas_id, sub_kelas, status, tgl_daftar) VALUES
        ('John Doe', 'L', 'Jakarta', '2008-01-15', 'Jl. Sample No. 1', 1, 'X', 'TG 1', 1, '2024-07-01'),
        ('Jane Smith', 'P', 'Bandung', '2008-02-20', 'Jl. Sample No. 2', 2, 'X', 'RPL 1', 1, '2024-07-01')
      `);
    } else {
      // Cek apakah kolom sub_kelas ada
      const subKelasCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'data_siswa' 
          AND column_name = 'sub_kelas'
        );
      `);
      
      if (!subKelasCheck.rows[0].exists) {
        // Tambahkan kolom sub_kelas
        await pool.query(`
          ALTER TABLE data_siswa 
          ADD COLUMN sub_kelas VARCHAR(10) DEFAULT NULL;
        `);
      }
      
      // Ubah tipe data kelas_id menjadi VARCHAR jika masih INTEGER
      const kelasIdTypeCheck = await pool.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'data_siswa' 
        AND column_name = 'kelas_id'
      `);
      
      if (kelasIdTypeCheck.rows.length > 0 && kelasIdTypeCheck.rows[0].data_type === 'integer') {
        await pool.query(`
          ALTER TABLE data_siswa 
          ALTER COLUMN kelas_id TYPE VARCHAR(5);
        `);
        console.log('Column kelas_id type changed to VARCHAR');
      }
    }
    
    res.json({ 
      message: 'Table data_siswa checked successfully',
      exists: tableExists,
      created: !tableExists
    });
  } catch (err) {
    console.error('Error checking siswa table:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ambil semua data siswa
app.get('/api/siswa', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM data_siswa ORDER BY id_siswa DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching siswa:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ambil data siswa berdasarkan ID
app.get('/api/siswa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'ID harus berupa angka' });
    }
    const siswaId = parseInt(id, 10);
    const result = await pool.query(
      'SELECT * FROM data_siswa WHERE id_siswa = $1',
      [siswaId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data siswa tidak ditemukan' });
    }
    const siswa = result.rows[0];
    siswa.tgl_masuk = siswa.tgl_daftar;
    res.json(siswa);
  } catch (err) {
    console.error('Error fetching siswa by ID:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Upload data calon siswa ke data siswa berdasarkan ID
app.post('/api/calon-siswa/upload/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Upload calon siswa, id param:', id, 'typeof:', typeof id);
    // Gunakan id string
    const calonSiswaId = id;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Query dengan string id
      const checkResult = await client.query(
        'SELECT * FROM data_calon_siswa WHERE id_calon_siswa = $1',
        [calonSiswaId]
      );
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Data calon siswa tidak ditemukan' });
      }
      const calonSiswa = checkResult.rows[0];
      // Insert ke data_siswa (id_siswa otomatis)
      const insertResult = await client.query(`
        INSERT INTO data_siswa (
          nama, jenis_kelamin, tempat_lahir, tgl_lahir, alamat, no_telp,
          agama, nama_ortu, jurusan_id, kelas_id, status, tgl_daftar,
          desa, kecamatan, kabupaten
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *
      `, [
        calonSiswa.nama,
        calonSiswa.jenis_kelamin || null,
        calonSiswa.tempat_lahir || null,
        calonSiswa.tgl_lahir || null,
        calonSiswa.alamat || null,
        calonSiswa.no_telp || null,
        calonSiswa.agama || null,
        calonSiswa.nama_ortu || null,
        parseInt(calonSiswa.jurusan_id, 10) || 1,
        1, // kelas_id default ke 1
        1, // status aktif
        calonSiswa.tgl_daftar || new Date(),
        calonSiswa.desa || null,
        calonSiswa.kecamatan || null,
        calonSiswa.kabupaten || null
      ]);
      await client.query('COMMIT');
      res.json({ 
        message: 'Data berhasil diupload ke data siswa', 
        data: insertResult.rows[0] 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error uploading calon siswa:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Test Email Service Endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { email, customSender } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const testOTP = generateOTP();
    saveOTP(email, testOTP);
    
    const emailSent = await sendOTPEmail(email, testOTP, false, customSender);
    
    if (!emailSent) {
      console.log("Test OTP for " + email + ": " + testOTP);
    }
    
    res.json({
      message: emailSent 
        ? `Test email sent successfully to ${email}`
        : `Test email failed, OTP: ${testOTP} (check console)`,
      email: email,
      emailSent: emailSent,
      otp: testOTP, // For testing purposes
      sender: customSender ? customSender.email : 'default'
    });
    
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Send OTP with Custom Sender Endpoint
app.post('/api/send-otp-custom', async (req, res) => {
  try {
    const { email, customSender } = req.body;
    
    if (!email || !customSender) {
      return res.status(400).json({ 
        error: 'Email and customSender are required',
        example: {
          email: "user@example.com",
          customSender: {
            email: "your-email@gmail.com",
            password: "your-app-password",
            service: "gmail",
            name: "SMK Palapa Pare"
          }
        }
      });
    }
    
    const otp = generateOTP();
    saveOTP(email, otp);
    
    const emailSent = await sendOTPEmail(email, otp, false, customSender);
    
    if (!emailSent) {
      console.log(`Custom OTP for ${email}: ${otp}`);
    }
    
    res.json({
      message: emailSent 
        ? `OTP sent successfully to ${email} from ${customSender.email}`
        : `Failed to send OTP, check console for: ${otp}`,
      email: email,
      sender: customSender.email,
      emailSent: emailSent,
      otp: otp // For testing purposes
    });
    
  } catch (err) {
    console.error('Custom OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Tambahkan di bawah endpoint lain
app.get('/api/pembayaran', async (req, res) => {
  try {
    // Return tanggal as YYYY-MM-DD string to avoid timezone shifts in frontend
    const result = await pool.query(`
      SELECT id, nama_siswa, kelas, jumlah_bayar, metode, status, keterangan,
             to_char(tanggal::timestamp, 'YYYY-MM-DD') AS tanggal, created_at
      FROM pembayaran
      ORDER BY id DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching pembayaran:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Tambah data pembayaran
app.post('/api/pembayaran', async (req, res) => {
  try {
    const {
      nama_siswa,
      kelas,
      jumlah_bayar,
      metode,
      tanggal,
      status,
      keterangan
    } = req.body;

    // Validasi sederhana
    if (!nama_siswa || !kelas || !jumlah_bayar || !metode || !tanggal || !status) {
      return res.status(400).json({ success: false, error: 'Data tidak lengkap' });
    }

    const result = await pool.query(
      `INSERT INTO pembayaran 
        (nama_siswa, kelas, jumlah_bayar, metode, tanggal, status, keterangan)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        nama_siswa,
        kelas,
        jumlah_bayar,
        metode,
        tanggal,
        status,
        keterangan || null
      ]
    );

  // Format returned tanggal to YYYY-MM-DD before sending
  const row = result.rows[0];
  if (row && row.tanggal) row.tanggal = row.tanggal.toISOString ? row.tanggal.toISOString().slice(0,10) : row.tanggal;
  res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error saving pembayaran:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Contoh endpoint untuk transaksi terakhir
app.get('/api/pembayaran/terakhir', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nama_siswa, kelas, jumlah_bayar, metode, status, keterangan,
             to_char(tanggal::timestamp, 'YYYY-MM-DD') AS tanggal, created_at
      FROM pembayaran
      ORDER BY tanggal DESC, id DESC
      LIMIT 1
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint untuk laporan kenaikan kelas - SESUAIKAN DENGAN DATABASE ANDA
app.get('/api/laporan/kenaikan-kelas', async (req, res) => {
  try {
    const { kelas, id_siswa, tahun } = req.query;
    
    console.log('Received parameters:', { kelas, id_siswa });
    
    const params = [];
    let paramIndex = 1;
    
    // Validasi untuk id_siswa
    let idSiswaNum = null;
    if (id_siswa !== undefined && id_siswa !== null && id_siswa !== '') {
      const idSiswaStr = String(id_siswa).trim();
      if (idSiswaStr !== '' && !isNaN(idSiswaStr) && idSiswaStr !== 'null' && idSiswaStr !== 'undefined') {
        const parsed = parseInt(idSiswaStr, 10);
        if (!isNaN(parsed) && parsed > 0) {
          idSiswaNum = parsed;
        }
      }
    }
    
    // Query sesuai struktur database
    let query = `
      SELECT 
        ds.id_siswa,
        ds.nama,
        CASE 
          WHEN ds.kelas_id = 1 THEN 'X'
          WHEN ds.kelas_id = 2 THEN 'XI' 
          WHEN ds.kelas_id = 3 THEN 'XII'
          ELSE 'X'
        END AS kelas,
        CASE 
          WHEN ds.jurusan_id = 1 THEN 'TG'
          WHEN ds.jurusan_id = 2 THEN 'RPL'
          ELSE 'Umum'
        END AS jurusan,
        COALESCE(CAST(SUM(ts.nilai) AS NUMERIC), 0) AS target,
        COALESCE(CAST(SUM(ts.terbayar) AS NUMERIC), 0) AS total_bayar,
        COALESCE(CAST(SUM(ts.nilai) - SUM(ts.terbayar) AS NUMERIC), 0) AS sisa,
        CASE 
          WHEN COUNT(ts.id) = 0 THEN 'Belum Ada Tagihan'
          ELSE 'Naik'
        END AS status
      FROM data_siswa ds
      LEFT JOIN tagihan_siswa ts ON ds.id_siswa = ts.siswa_id
      WHERE 1=1
    `;
    
    // Filter kelas berdasarkan mapping integer ke string
    if (kelas && kelas !== '' && kelas.trim() !== '' && kelas !== 'null' && kelas !== 'undefined') {
      const kelasClean = kelas.trim();
      
      // Mapping untuk kelas: '1' = X, '2' = XI, '3' = XII, dst
      const kelasMapping = {
        '1': 1,  // X 1
        '2': 1,  // X 2
        '3': 2,  // XI 1
        '4': 2,  // XI 2
        '5': 3,  // XII 1
        '6': 3   // XII 2
      };
      
      if (kelasMapping[kelasClean]) {
        query += ` AND ds.kelas_id = $${paramIndex}`;
        params.push(kelasMapping[kelasClean]);
        paramIndex++;
        
        // Tambahkan filter sub_kelas jika perlu
        const subKelasMapping = {
          '1': 'TG 1',
          '2': 'TG 2',
          '3': 'RPL 1',
          '4': 'RPL 2',
          '5': 'TG 1',  // XII TG 1
          '6': 'TG 2'   // XII TG 2
        };
        
        if (subKelasMapping[kelasClean]) {
          query += ` AND ds.sub_kelas = $${paramIndex}`;
          params.push(subKelasMapping[kelasClean]);
          paramIndex++;
        }
      }
    }
    
    // Tambahkan validasi tahun
    let tahunNum = null;
    if (tahun !== undefined && tahun !== null && tahun !== '' && tahun !== 'null' && tahun !== 'undefined') {
      const tahunStr = String(tahun).trim();
      const parsed = parseInt(tahunStr, 10);
      if (!isNaN(parsed) && parsed > 2000 && parsed < 2100) {
        tahunNum = parsed;
      }
    }
    
    // Tambahkan filter tahun jika valid
    if (tahunNum !== null) {
      query += ` AND EXTRACT(YEAR FROM ds.tgl_daftar) = $${paramIndex}`;
      params.push(tahunNum);
      paramIndex++;
    }
    
    // Validasi untuk jurusan_id
    const jurusan_id = req.query.jurusan_id;

    if (
      jurusan_id &&
      jurusan_id !== '' &&
      jurusan_id !== 'null' &&
      jurusan_id !== 'undefined'
    ) {
      query += ` AND ds.jurusan_id = $${paramIndex}`;
      params.push(jurusan_id);
      paramIndex++;
    }
    
    query += `
      GROUP BY ds.id_siswa, ds.nama, ds.kelas_id, ds.jurusan_id
      ORDER BY ds.nama ASC
    `;
    
    console.log('Executing query:', query);
    console.log('With parameters:', params);
    
    const result = await pool.query(query, params);
    
    // Format data untuk frontend
    const formattedData = result.rows.map(row => {
      const target = parseFloat(row.target || 0);
      const totalBayar = parseFloat(row.total_bayar || 0);
      const sisa = parseFloat(row.sisa || 0);
      const formatNumber = (num) => {
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      };
      return {
        nama: row.nama,
        kelas: `${row.kelas} ${row.jurusan}`,
        target: formatNumber(target),
        totalBayar: formatNumber(totalBayar),
        sisa: formatNumber(sisa),
        status: row.status
      };
    });
    
    res.json(formattedData);
    
  } catch (err) {
    console.error('Error fetching laporan kenaikan kelas:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      query: req.query
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
});

// Cek dan buat tabel bantuan_siswa jika belum ada
app.get('/api/check-bantuan-table', async (req, res) => {
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bantuan_siswa'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      await pool.query(`
        CREATE TABLE bantuan_siswa (
          id_bantuan SERIAL PRIMARY KEY,
          id_siswa INTEGER NOT NULL,
          nama_siswa VARCHAR(100) NOT NULL,
          kelas VARCHAR(20),
          jenis_bantuan VARCHAR(50) NOT NULL,
          jumlah_bantuan NUMERIC(15,2) NOT NULL,
          tanggal DATE NOT NULL,
          tahun INTEGER,
          biaya_transaksi NUMERIC(15,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_siswa) REFERENCES data_siswa(id_siswa) ON DELETE CASCADE
        );
      `);
      res.json({ message: 'Tabel bantuan_siswa berhasil dibuat', created: true });
    } else {
      res.json({ message: 'Tabel bantuan_siswa sudah ada', created: false });
    }
  } catch (err) {
    console.error('Error checking/creating bantuan_siswa table:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk menyimpan data bantuan siswa
app.post('/api/bantuan-siswa', async (req, res) => {
  try {
    const { data_bantuan } = req.body;
    
    if (!data_bantuan || !Array.isArray(data_bantuan) || data_bantuan.length === 0) {
      return res.status(400).json({ error: 'Data bantuan tidak boleh kosong' });
    }

    // Cek dan tambahkan kolom biaya_transaksi jika belum ada
    const columnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bantuan_siswa' 
        AND column_name = 'biaya_transaksi'
      );
    `);
    
    if (!columnCheck.rows[0].exists) {
      await pool.query(`
        ALTER TABLE bantuan_siswa 
        ADD COLUMN biaya_transaksi INT;
      `);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const insertedData = [];
      for (const item of data_bantuan) {
        const { id_siswa, jenis_bantuan, jumlah, tanggal, tahun, biaya_transaksi } = item;
        
        if (!id_siswa || !jenis_bantuan || !jumlah || !tanggal || !tahun) {
          throw new Error('Data tidak lengkap: id_siswa, jenis_bantuan, jumlah, tanggal, dan tahun wajib diisi');
        }

        const result = await client.query(
          `INSERT INTO bantuan_siswa 
            (id_siswa, jenis_bantuan, jumlah, tanggal, tahun, biaya_transaksi)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [id_siswa, jenis_bantuan, parseInt(jumlah), tanggal, parseInt(tahun), biaya_transaksi ? parseInt(biaya_transaksi) : null]
        );
        
        // Ambil data siswa untuk response
        const siswaResult = await client.query(
          'SELECT nama FROM data_siswa WHERE id_siswa = $1',
          [id_siswa]
        );
        
        const siswaData = siswaResult.rows[0] || {};
        insertedData.push({
          ...result.rows[0],
          nama_siswa: siswaData.nama || '-'
        });
      }
      
      await client.query('COMMIT');
      res.json({ success: true, data: insertedData, message: `Berhasil menyimpan ${insertedData.length} data bantuan` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error saving bantuan siswa:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk mengambil data bantuan siswa (untuk laporan)
app.get('/api/bantuan-siswa', async (req, res) => {
  try {
    const { tanggal, tahun, jenis_bantuan } = req.query;
    
    let query = `
      SELECT 
        bs.id,
        bs.id_siswa,
        ds.nama AS nama_siswa,
        bs.jenis_bantuan,
        bs.jumlah,
        bs.jumlah AS jumlah_bantuan,
        bs.biaya_transaksi,
        to_char(bs.tanggal, 'YYYY-MM-DD') AS tanggal,
        bs.tahun,
        bs.created_at,
        CASE 
          WHEN ds.kelas_id = 1 THEN 'X'
          WHEN ds.kelas_id = 2 THEN 'XI' 
          WHEN ds.kelas_id = 3 THEN 'XII'
          ELSE 'X'
        END || 
        CASE 
          WHEN ds.jurusan_id = 1 THEN '-TG'
          WHEN ds.jurusan_id = 2 THEN '-RPL'
          ELSE ''
        END AS kelas
      FROM bantuan_siswa bs
      LEFT JOIN data_siswa ds ON bs.id_siswa = ds.id_siswa
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (tanggal) {
      query += ` AND bs.tanggal = $${paramIndex}`;
      params.push(tanggal);
      paramIndex++;
    }
    
    if (tahun) {
      query += ` AND bs.tahun = $${paramIndex}`;
      params.push(parseInt(tahun));
      paramIndex++;
    }
    
    if (jenis_bantuan) {
      query += ` AND bs.jenis_bantuan = $${paramIndex}`;
      params.push(jenis_bantuan);
      paramIndex++;
    }
    
    query += ` ORDER BY bs.tanggal DESC, bs.id DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching bantuan siswa:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk mendapatkan riwayat penggunaan bantuan siswa
app.get('/api/penggunaan-bantuan/:siswa_id', async (req, res) => {
  try {
    const { siswa_id } = req.params;
    
    // Cek apakah tabel penggunaan_bantuan ada
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'penggunaan_bantuan'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Jika tabel belum ada, return array kosong
      return res.json({ success: true, data: [] });
    }
    
    const query = `
      SELECT 
        id,
        siswa_id,
        jenis_bantuan,
        jumlah,
        tagihan_id,
        to_char(tanggal, 'YYYY-MM-DD') AS tanggal,
        to_char(tanggal, 'HH24:MI:SS') AS waktu
      FROM penggunaan_bantuan
      WHERE siswa_id = $1
      ORDER BY tanggal ASC, id ASC
    `;
    
    const result = await pool.query(query, [siswa_id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching penggunaan bantuan:', err);
    // Jika error karena tabel tidak ada, return array kosong
    if (err.message.includes('does not exist') || err.message.includes('relation') || err.message.includes('table')) {
      return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint untuk mendapatkan saldo bantuan siswa
app.get('/api/saldo-bantuan/:siswa_id', async (req, res) => {
  try {
    const { siswa_id } = req.params;

    // Hitung saldo bantuan dari bantuan_siswa (jumlah positif dan negatif)
    const saldoQuery = `
      SELECT 
        jenis_bantuan,
        COALESCE(SUM(jumlah), 0) as saldo
      FROM bantuan_siswa
      WHERE id_siswa = $1
      GROUP BY jenis_bantuan
    `;
    
    const saldoResult = await pool.query(saldoQuery, [siswa_id]);

    // Format hasil
    const saldo = {};
    saldoResult.rows.forEach(row => {
      saldo[row.jenis_bantuan] = parseFloat(row.saldo);
    });

    res.json({ success: true, data: saldo });
  } catch (err) {
    console.error('Error fetching saldo bantuan:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint untuk proses pembayaran tagihan dengan dukungan saldo bantuan
app.post('/api/tagihan/bayar', async (req, res) => {
  try {
    const { siswa_id, jumlah_bayar, metode, tagihan_ids, gunakan_bantuan } = req.body;

    if (!siswa_id || !jumlah_bayar || !metode) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Cek dan buat tabel penggunaan_bantuan jika belum ada
      await client.query(`
        CREATE TABLE IF NOT EXISTS penggunaan_bantuan (
          id SERIAL PRIMARY KEY,
          siswa_id INTEGER NOT NULL,
          jenis_bantuan VARCHAR(50) NOT NULL,
          jumlah NUMERIC(15,2) NOT NULL,
          tagihan_id INTEGER,
          tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (siswa_id) REFERENCES data_siswa(id_siswa) ON DELETE CASCADE
        );
      `);

      // Ambil data siswa
      const siswaResult = await client.query(
        'SELECT id_siswa, nama FROM data_siswa WHERE id_siswa = $1',
        [siswa_id]
      );

      if (siswaResult.rows.length === 0) {
        throw new Error('Siswa tidak ditemukan');
      }

      const siswa = siswaResult.rows[0];

      // Jika menggunakan bantuan, cek saldo tersedia
      let saldoBantuan = {};
      let totalSaldoTersedia = 0;
      let jumlahDariBantuan = 0;
      const penggunaanBantuan = [];

      if (gunakan_bantuan && ['kip', 'gnota', 'bksm'].includes(metode.toLowerCase())) {
        const jenisBantuan = metode.toUpperCase();
        
        // Hitung saldo tersedia
        const saldoQuery = `
          SELECT 
            COALESCE(SUM(jumlah), 0) as total_diterima,
            COALESCE(SUM(biaya_transaksi), 0) as total_transaksi
          FROM bantuan_siswa
          WHERE id_siswa = $1 AND jenis_bantuan = $2
        `;
        const saldoResult = await client.query(saldoQuery, [siswa_id, jenisBantuan]);
        
        const penggunaanQuery = `
          SELECT COALESCE(SUM(jumlah), 0) as total_digunakan
          FROM penggunaan_bantuan
          WHERE siswa_id = $1 AND jenis_bantuan = $2
        `;
        const penggunaanResult = await client.query(penggunaanQuery, [siswa_id, jenisBantuan]);

        const diterima = parseFloat(saldoResult.rows[0].total_diterima);
        const transaksi = parseFloat(saldoResult.rows[0].total_transaksi || 0);
        const digunakan = parseFloat(penggunaanResult.rows[0].total_digunakan || 0);
        totalSaldoTersedia = Math.max(0, diterima - transaksi - digunakan);

        jumlahDariBantuan = Math.min(parseFloat(jumlah_bayar), totalSaldoTersedia);
        
        if (jumlahDariBantuan > totalSaldoTersedia) {
          throw new Error(`Saldo ${jenisBantuan} tidak mencukupi. Saldo tersedia: Rp ${totalSaldoTersedia.toLocaleString('id-ID')}`);
        }
      }

      // Ambil tagihan yang dipilih atau semua tagihan belum lunas
      let tagihanQuery;
      let tagihanParams;
      
      if (tagihan_ids && tagihan_ids.length > 0) {
        tagihanQuery = `
          SELECT id, nama_tagihan, nilai, terbayar 
          FROM tagihan_siswa 
          WHERE siswa_id = $1 AND id = ANY($2::int[])
          ORDER BY jatuh_tempo ASC
        `;
        tagihanParams = [siswa_id, tagihan_ids];
      } else {
        tagihanQuery = `
          SELECT id, nama_tagihan, nilai, terbayar 
          FROM tagihan_siswa 
          WHERE siswa_id = $1 AND status != 'lunas'
          ORDER BY jatuh_tempo ASC
        `;
        tagihanParams = [siswa_id];
      }

      const tagihanResult = await client.query(tagihanQuery, tagihanParams);
      
      if (tagihanResult.rows.length === 0) {
        throw new Error('Tidak ada tagihan yang perlu dibayar');
      }

      // Jika menggunakan bantuan, catat penggunaan bantuan terlebih dahulu
      if (jumlahDariBantuan > 0) {
        const jenisBantuan = metode.toUpperCase();

        // Catat penggunaan bantuan di bantuan_siswa dengan jumlah negatif
        await client.query(
          `INSERT INTO bantuan_siswa (id_siswa, jenis_bantuan, jumlah, tanggal, tahun)
           VALUES ($1, $2, $3, $4, $5)`,
          [siswa_id, jenisBantuan, -jumlahDariBantuan, new Date().toISOString().slice(0,10), new Date().getFullYear()]
        );
      }

      // Distribusi pembayaran
      let sisaBayar = parseFloat(jumlah_bayar);
      const updatedTagihan = [];

      for (const tagihan of tagihanResult.rows) {
        if (sisaBayar <= 0) break;

        const sisaTagihan = tagihan.nilai - tagihan.terbayar;
        const bayarTagihan = Math.min(sisaBayar, sisaTagihan);
        const terbayarBaru = tagihan.terbayar + bayarTagihan;
        const statusBaru = terbayarBaru >= tagihan.nilai ? 'lunas' : 
                          terbayarBaru > 0 ? 'cicilan' : 'belum_lunas';

        await client.query(
          `UPDATE tagihan_siswa 
           SET terbayar = $1, status = $2 
           WHERE id = $3`,
          [terbayarBaru, statusBaru, tagihan.id]
        );

        updatedTagihan.push({
          nama_tagihan: tagihan.nama_tagihan,
          bayar: bayarTagihan
        });

        sisaBayar -= bayarTagihan;
      }

      // Catat ke tabel pembayaran
      const totalTagihan = tagihanResult.rows.reduce((sum, t) => sum + t.nilai, 0);
      const totalTerbayar = tagihanResult.rows.reduce((sum, t) => sum + t.terbayar, 0);
      const sisaTagihan = Math.max(0, totalTagihan - totalTerbayar - jumlah_bayar);

      await client.query(
        `INSERT INTO pembayaran 
         (nama_siswa, kelas, jumlah_bayar, metode, tanggal, status, keterangan)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        siswa.nama,
        'Siswa Aktif',
        jumlah_bayar,
        metode,
        new Date().toISOString().slice(0, 10),
        sisaTagihan <= 0 ? 'Lunas' : 'Cicilan',
        `Pembayaran: ${updatedTagihan.map(t => `${t.nama_tagihan} (Rp ${t.bayar.toLocaleString('id-ID')})`).join(', ')}`
      ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Pembayaran berhasil',
        detail: updatedTagihan,
        sisa_bayar: sisaBayar
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint untuk posting target/tagihan siswa
app.post('/api/target/posting', async (req, res) => {
  try {
    const { siswa_ids, nama_tagihan, nilai, jatuh_tempo, semester, tahun_biaya } = req.body;

    if (!siswa_ids || !Array.isArray(siswa_ids) || siswa_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Pilih minimal satu siswa' });
    }

    if (!nama_tagihan || !nilai || !jatuh_tempo) {
      return res.status(400).json({ success: false, error: 'Data tagihan tidak lengkap' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const createdTagihan = [];
      const errors = [];

      for (const siswaId of siswa_ids) {
        try {
          // Cek apakah siswa ada
          const siswaCheck = await client.query(
            'SELECT id_siswa, nama FROM data_siswa WHERE id_siswa = $1',
            [siswaId]
          );

          if (siswaCheck.rows.length === 0) {
            errors.push(`Siswa ID ${siswaId} tidak ditemukan`);
            continue;
          }

          // Buat nama tagihan dengan semester jika ada
          let finalNamaTagihan = nama_tagihan;
          if (semester && semester !== '0') {
            finalNamaTagihan = `${nama_tagihan} - Semester ${semester}`;
          }
          if (tahun_biaya) {
            finalNamaTagihan = `${finalNamaTagihan} (${tahun_biaya})`;
          }

          // Insert tagihan
          const result = await client.query(
            `INSERT INTO tagihan_siswa (siswa_id, nama_tagihan, nilai, terbayar, jatuh_tempo, status)
             VALUES ($1, $2, $3, 0, $4, 'belum_lunas')
             RETURNING id, nama_tagihan, nilai, jatuh_tempo`,
            [siswaId, finalNamaTagihan, parseFloat(nilai), jatuh_tempo]
          );

          createdTagihan.push({
            siswa_id: siswaId,
            siswa_nama: siswaCheck.rows[0].nama,
            tagihan: result.rows[0]
          });
        } catch (err) {
          errors.push(`Error untuk siswa ID ${siswaId}: ${err.message}`);
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Berhasil membuat ${createdTagihan.length} tagihan`,
        data: createdTagihan,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('Error posting target:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint untuk update schema kelas_id dan sub_kelas
app.get('/api/update-siswa-schema', async (req, res) => {
  try {
    // Cek tipe data kelas_id
    const kelasIdCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'data_siswa' 
      AND column_name = 'kelas_id'
    `);
    
    // Satu client untuk transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update data existing SEBELUM mengubah tipe kolom
      // Convert kelas_id integer ke format baru
      await client.query(`
        UPDATE data_siswa 
        SET kelas_id = CASE 
          WHEN kelas_id = 1 THEN 'X'
          WHEN kelas_id = 2 THEN 'XI'
          WHEN kelas_id = 3 THEN 'XII'
          WHEN kelas_id = 10 THEN 'X'
          WHEN kelas_id = 11 THEN 'XI'
          WHEN kelas_id = 12 THEN 'XII'
          ELSE kelas_id::text
        END::text
        WHERE kelas_id IN (1, 2, 3, 10, 11, 12);
      `);
      
      console.log('Updated kelas_id data');
      
      // Ubah tipe kelas_id ke VARCHAR
      await client.query(`
        ALTER TABLE data_siswa 
        ALTER COLUMN kelas_id TYPE VARCHAR(5) USING kelas_id::text;
      `);
      console.log('Column kelas_id changed to VARCHAR');
      
      // Update data existing: Convert sub_kelas integer ke format baru
      await client.query(`
        UPDATE data_siswa 
        SET sub_kelas = CASE 
          WHEN sub_kelas = 1 THEN 'TG 1'
          WHEN sub_kelas = 2 THEN 'TG 2'
          WHEN sub_kelas = 3 THEN 'RPL 1'
          WHEN sub_kelas = 4 THEN 'RPL 2'
          ELSE sub_kelas::text
        END::text
        WHERE sub_kelas IS NOT NULL;
      `);
      
      console.log('Updated sub_kelas data');
      
      // Cek tipe data sub_kelas
      const subKelasCheck = await pool.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'data_siswa' 
        AND column_name = 'sub_kelas'
      `);
      
      if (subKelasCheck.rows.length > 0 && subKelasCheck.rows[0].data_type === 'integer') {
        // Ubah tipe sub_kelas ke VARCHAR
        await client.query(`
          ALTER TABLE data_siswa 
          ALTER COLUMN sub_kelas TYPE VARCHAR(10) USING sub_kelas::text;
        `);
        console.log('Column sub_kelas changed to VARCHAR');
      }
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
    res.json({ 
      success: true,
      message: 'Schema updated successfully'
    });
    
  } catch (err) {
    console.error('Error updating schema:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint untuk mendapatkan laporan siswa per kelas
app.get('/api/laporan-siswa', async (req, res) => {
  try {
    // Ambil tahun dan kelas dari query
    const tahun = req.query.tahun_daftar || req.query.tahun;
    const kelas = req.query.kelas;
    const jurusan_id = req.query.jurusan_id;
    const filter_nama = req.query.filter_nama;

    console.log('Received filters:', { tahun, kelas, jurusan_id, filter_nama }); // Debug log

    // Pastikan tabel jurusan ada
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'jurusan'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Buat tabel jurusan
      await pool.query(`
        CREATE TABLE jurusan (
          id SERIAL PRIMARY KEY,
          nama_jurusan VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Insert sample jurusan
      await pool.query(`
        INSERT INTO jurusan (nama_jurusan) VALUES
        ('TEKNIK GRAFIKA'),
        ('TEKNIK KOMPUTER JARINGAN'),
        ('AKUNTANSI'),
        ('BISNIS DIGITAL')
      `);
    }
    
    let query = `
      SELECT 
        ds.id_siswa,
        ds.nama,
        ds.alamat,
        ds.jenis_kelamin,
        ds.jurusan_id,
        ds.kelas_id,
        ds.sub_kelas,
        ds.tgl_daftar,
        j.nama AS nama_jurusan
      FROM data_siswa ds
      LEFT JOIN jurusan j ON ds.jurusan_id = j.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    
    // Filter kelas (hanya jika tidak ada filter kelas+jurusan kombinasi)
    if (kelas && kelas !== '' && kelas.trim() !== '' && kelas !== 'null' && kelas !== 'undefined') {
      const kelasClean = kelas.trim();
      
      // Mapping kelas id ke string
      const kelasMapping = { 
        '1': 'X', 
        '2': 'XI', 
        '3': 'XII',
        '10': 'X',
        '11': 'XI',
        '12': 'XII'
      };
      
      const kelasStr = kelasMapping[kelasClean] || kelasClean;
      
      query += ` AND ds.kelas_id::TEXT = $${paramIndex}`;
      params.push(kelasStr);
      paramIndex++;
    }
    
    // Filter jurusan (INDEPENDENT dari kelas)
    if (jurusan_id && jurusan_id !== '' && jurusan_id !== 'null' && jurusan_id !== 'undefined') {
      const jurusanClean = jurusan_id.trim();
      // Konversi ke integer jika berbentuk string angka
      const jurusanInt = parseInt(jurusanClean, 10);
      
      if (!isNaN(jurusanInt)) {
        query += ` AND ds.jurusan_id = $${paramIndex}`;
        params.push(jurusanInt);
        paramIndex++;
      }
    }
    
    // Tambahkan validasi tahun
    let tahunNum = null;
    if (tahun !== undefined && tahun !== null && tahun !== '' && tahun !== 'null' && tahun !== 'undefined') {
      const tahunStr = String(tahun).trim();
      const parsed = parseInt(tahunStr, 10);
      if (!isNaN(parsed) && parsed > 2000 && parsed < 2100) {
        tahunNum = parsed;
      }
    }
    
    // Tambahkan filter tahun jika valid
    if (tahunNum !== null) {
      query += ` AND EXTRACT(YEAR FROM ds.tgl_daftar) = $${paramIndex}`;
      params.push(tahunNum);
      paramIndex++;
    }
    
    // Filter nama
    if (filter_nama && filter_nama.trim() !== '') {
      query += ` AND ds.nama ILIKE $${paramIndex}`;
      params.push(`%${filter_nama}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY ds.nama ASC`;
    
    console.log('Executing query:', query);
    console.log('With parameters:', params);
    
    const result = await pool.query(query, params);
    
    // Hitung statistik
    const totalSiswa = result.rows.length;
    const siswaLaki = result.rows.filter(s => s.jenis_kelamin === 'L').length;
    const siswaPerempuan = result.rows.filter(s => s.jenis_kelamin === 'P').length;
    
    res.json({
      success: true,
      data: result.rows,
      statistik: {
        totalSiswa,
        siswaLaki,
        siswaPerempuan
      }
    });
    
  } catch (err) {
    console.error('Error fetching laporan siswa:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint untuk mendapatkan daftar jurusan
app.get('/api/jurusan', async (req, res) => {
  try {
    // Cek apakah tabel jurusan ada
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'jurusan'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Buat tabel jurusan
      await pool.query(`
        CREATE TABLE jurusan (
          id SERIAL PRIMARY KEY,
          nama_jurusan VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Insert sample jurusan
      await pool.query(`
        INSERT INTO jurusan (nama_jurusan) VALUES
        ('TEKNIK GRAFIKA'),
        ('TEKNIK KOMPUTER JARINGAN'),
        ('AKUNTANSI'),
        ('BISNIS DIGITAL')
      `);
    }
    
    const result = await pool.query('SELECT * FROM jurusan ORDER BY nama_jurusan');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching jurusan:', err);
    res.status(500).json({ error: err.message });
  }
});

// Hook untuk auto-create tagihan saat siswa baru ditambahkan
// Modifikasi endpoint POST /api/siswa
app.post('/api/siswa', async (req, res) => {
  try {
    const { 
      nama, 
      jenis_kelamin, 
      tempat_lahir, 
      tgl_lahir, 
      alamat,
      no_telp,
      agama,
      nama_ortu,
      jurusan_id, 
      kelas_id, 
      status, 
      tgl_daftar,
      desa, kecamatan, kabupaten
    } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert siswa
      const result = await client.query(
        `INSERT INTO data_siswa (
          nama, jenis_kelamin, tempat_lahir, tgl_lahir, alamat, no_telp, 
          agama, nama_ortu, jurusan_id, kelas_id, status, tgl_daftar,
          desa, kecamatan, kabupaten
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
        [nama, jenis_kelamin, tempat_lahir, tgl_lahir, alamat, no_telp,
         agama, nama_ortu, jurusan_id, kelas_id || 1, status || 1, tgl_daftar,
         desa || null, kecamatan || null, kabupaten || null]
      );
      
      const siswa = result.rows[0];
      
      await client.query('COMMIT');

      // Inisialisasi tagihan siswa SETELAH commit
      await initializeTagihanSiswa(siswa.id_siswa);
      
      res.json({
        success: true,
        data: siswa,
        message: 'Siswa berhasil ditambahkan'
      });
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('Error saving siswa:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ambil semua data siswa beserta jurusan
app.get('/api/siswa-jurusan', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ds.*, j.nama AS nama_jurusan
      FROM data_siswa ds
      LEFT JOIN jurusan j ON ds.jurusan_id = j.id
      ORDER BY ds.id_siswa DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching siswa jurusan:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk melihat struktur data siswa sebenarnya
app.get('/api/check-siswa-structure', async (req, res) => {
  try {
    // Cek struktur tabel data_siswa
    const structure = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'data_siswa'
      ORDER BY ordinal_position
    `);
    
    // Cek sample data
    const sampleData = await pool.query(`
      SELECT 
        id_siswa,
        nama,
        kelas_id,
        jurusan_id,
        status
      FROM data_siswa 
      ORDER BY id_siswa 
      LIMIT 10
    `);
    
    // Cek nilai unik untuk kelas_id dan jurusan_id
    const uniqueValues = await pool.query(`
      SELECT 
        COUNT(*) as total_siswa,
        kelas_id,
        COUNT(*) as count_per_kelas,
        jurusan_id,
        COUNT(*) as count_per_jurusan
      FROM data_siswa 
      GROUP BY kelas_id, jurusan_id
      ORDER BY kelas_id, jurusan_id
    `);
    
    res.json({
      success: true,
      structure: structure.rows,
      sample_data: sampleData.rows,
      unique_values: uniqueValues.rows,
      mapping: {
        kelas_id: {
          1: 'X',
          2: 'XI', 
          3: 'XII'
        },
        jurusan_id: {
          1: 'TG (Teknik Grafika)',
          2: 'RPL (Rekayasa Perangkat Lunak)'
        }
      }
    });
    
  } catch (err) {
    console.error('Error checking siswa structure:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint untuk mendapatkan tagihan siswa dengan query parameter
app.get('/api/tagihan', async (req, res) => {
  try {
    const { siswa_id } = req.query;

    if (!siswa_id) {
      return res.status(400).json({ success: false, error: 'siswa_id diperlukan' });
    }

    // Ambil data siswa
    const siswaResult = await pool.query(
      'SELECT id_siswa, nama FROM data_siswa WHERE id_siswa = $1',
      [siswa_id]
    );

    if (siswaResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' });
    }

    const siswa = siswaResult.rows[0];

    // Ambil tagihan siswa
    const tagihanResult = await pool.query(
      'SELECT * FROM tagihan_siswa WHERE siswa_id = $1 ORDER BY jatuh_tempo ASC',
      [siswa_id]
    );

    res.json({
      success: true,
      data: tagihanResult.rows,
      siswa: siswa
    });
  } catch (err) {
    console.error('Error fetching tagihan:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/tagihan-siswa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM tagihan_siswa WHERE siswa_id = $1 ORDER BY jatuh_tempo ASC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tagihan siswa:', err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk update kelas, jurusan, dan sub_kelas siswa
app.post('/api/siswa/bulk-update', async (req, res) => {
  try {
    const { ids, kelas_id, jurusan_id, sub_kelas } = req.body;
    
    // Validasi input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pilih minimal satu siswa' 
      });
    }
    
    if (!kelas_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Kelas tujuan harus dipilih' 
      });
    }
    
    if (!jurusan_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Jurusan tujuan harus dipilih' 
      });
    }
    
    // Validasi format ID
    const validIds = ids.filter(id => {
      const idNum = parseInt(id);
      return !isNaN(idNum) && idNum > 0;
    });
    
    if (validIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID siswa tidak valid' 
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let updateCount = 0;
      let errors = [];
      
      for (const id of validIds) {
        try {
          // Cek apakah siswa ada
          const checkResult = await client.query(
            'SELECT id_siswa, nama FROM data_siswa WHERE id_siswa = $1',
            [id]
          );
          
          if (checkResult.rows.length === 0) {
            errors.push(`Siswa dengan ID ${id} tidak ditemukan`);
            continue;
          }
          
          // Update data siswa
          if (sub_kelas !== undefined && sub_kelas !== null && sub_kelas !== '') {
            // Update dengan sub_kelas jika disediakan
            await client.query(
              `UPDATE data_siswa 
               SET kelas_id = $1, jurusan_id = $2, sub_kelas = $3 
               WHERE id_siswa = $4`,
              [kelas_id, jurusan_id, sub_kelas, id]
            );
          } else {
            // Update tanpa sub_kelas (hanya kelas_id dan jurusan_id)
            await client.query(
              `UPDATE data_siswa 
               SET kelas_id = $1, jurusan_id = $2 
               WHERE id_siswa = $3`,
              [kelas_id, jurusan_id, id]
            );
          }
          
          updateCount++;
          
        } catch (err) {
          errors.push(`Error memperbarui siswa ID ${id}: ${err.message}`);
        }
      }
      
      await client.query('COMMIT');
      
      const response = {
        success: true,
        message: `Berhasil memperbarui ${updateCount} dari ${validIds.length} siswa`,
        updated: updateCount,
        total: validIds.length
      };
      
      // Tambahkan informasi jika ada sub_kelas yang diupdate
      if (sub_kelas !== undefined && sub_kelas !== null && sub_kelas !== '') {
        response.sub_kelas_updated = sub_kelas;
      }
      
      // Tambahkan errors jika ada
      if (errors.length > 0) {
        response.errors = errors;
      }
      
      res.json(response);
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Error bulk update siswa:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      detail: 'Terjadi kesalahan saat memperbarui data siswa'
    });
  }
});

// Naik kelas
app.post('/api/siswa/naik-kelas', async (req, res) => {
  try {
    const { ids, kelas_id_baru, sub_kelas_baru } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Pilih minimal satu siswa' });
    }
    if (!kelas_id_baru || !sub_kelas_baru) {
      return res.status(400).json({ success: false, error: 'Kelas dan sub kelas tujuan harus dipilih' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const id of ids) {
        await client.query(
          `UPDATE data_siswa SET kelas_id = $1, sub_kelas = $2 WHERE id_siswa = $3`,
          [kelas_id_baru, sub_kelas_baru, id]
        );
      }
      await client.query('COMMIT');
      res.json({ success: true, message: `Berhasil memindahkan ${ids.length} siswa ke kelas baru.` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error naik kelas:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update data siswa berdasarkan ID
app.put('/api/siswa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama, jenis_kelamin, tempat_lahir, tgl_lahir, no_telp, agama,
      jurusan_id, kelas_id, tgl_daftar, alamat, status,
      nama_ortu, informasi_tambahan,
      desa, kecamatan, kabupaten
    } = req.body;

    const result = await pool.query(
      `UPDATE data_siswa SET
        nama = $1,
        jenis_kelamin = $2,
        tempat_lahir = $3,
        tgl_lahir = $4,
        no_telp = $5,
        agama = $6,
        jurusan_id = $7,
        kelas_id = $8,
        tgl_daftar = $9,
        alamat = $10,
        status = $11,
        nama_ortu = $12,
        informasi_tambahan = $13,
        desa = $14,
        kecamatan = $15,
        kabupaten = $16
      WHERE id_siswa = $17`,
      [
        nama, jenis_kelamin, tempat_lahir, tgl_lahir, no_telp, agama,
        jurusan_id, kelas_id, tgl_daftar, alamat, status,
        nama_ortu, informasi_tambahan, desa, kecamatan, kabupaten, id
      ]
    );

    res.json({ success: true, message: 'Data siswa berhasil diperbarui.' });
  } catch (err) {
    console.error('Error update siswa:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint untuk laporan rekap per tahun - DIPERBAIKI
app.get('/api/laporan/rekap-per-tahun', async (req, res) => {
  try {
    const { tahun } = req.query;
    
    // Validasi tahun
    let tahunNum = null;
    if (tahun !== undefined && tahun !== null && tahun !== '' && tahun !== 'null' && tahun !== 'undefined') {
      const tahunStr = String(tahun).trim();
      const parsed = parseInt(tahunStr, 10);
      if (!isNaN(parsed) && parsed > 2000 && parsed < 2100) {
        tahunNum = parsed;
      }
    }
    
    if (!tahunNum) {
      return res.status(400).json({ success: false, error: 'Tahun harus diisi dan valid (2000-2099)' });
    }

    // 1. Data Siswa per Tahun
    const siswaQuery = `
      SELECT 
        COUNT(*) as total_siswa,
        COUNT(CASE WHEN jenis_kelamin = 'L' THEN 1 END) as siswa_laki,
        COUNT(CASE WHEN jenis_kelamin = 'P' THEN 1 END) as siswa_perempuan,
        COUNT(CASE 
          WHEN CAST(kelas_id AS TEXT) IN ('X', '1', '10') 
          THEN 1 
        END) as kelas_x,
        COUNT(CASE 
          WHEN CAST(kelas_id AS TEXT) IN ('XI', '2', '11') 
          THEN 1 
        END) as kelas_xi,
        COUNT(CASE 
          WHEN CAST(kelas_id AS TEXT) IN ('XII', '3', '12') 
          THEN 1 
        END) as kelas_xii,
        COUNT(CASE WHEN jurusan_id = 1 THEN 1 END) as jurusan_tg,
        COUNT(CASE WHEN jurusan_id = 2 THEN 1 END) as jurusan_rpl
      FROM data_siswa
      WHERE EXTRACT(YEAR FROM tgl_daftar) = $1
    `;
    
    const siswaResult = await pool.query(siswaQuery, [tahunNum]);
    const siswaStats = siswaResult.rows[0] || {};

    // 2. Data Calon Siswa per Tahun
    const calonSiswaQuery = `
      SELECT 
        COUNT(*) as total_calon_siswa,
        COUNT(CASE WHEN status = 1 THEN 1 END) as diterima,
        COUNT(CASE WHEN status = 2 THEN 1 END) as ditolak,
        COUNT(CASE WHEN status = 0 THEN 1 END) as pending
      FROM data_calon_siswa
      WHERE EXTRACT(YEAR FROM tgl_daftar) = $1
    `;
    
    const calonSiswaResult = await pool.query(calonSiswaQuery, [tahunNum]);
    const calonSiswaStats = calonSiswaResult.rows[0] || {};

    // 3. Data Pembayaran per Tahun
    const pembayaranQuery = `
      SELECT 
        COUNT(*) as total_transaksi,
        COALESCE(SUM(jumlah_bayar), 0) as total_pembayaran,
        COUNT(CASE WHEN status = 'Sukses' OR status = 'Lunas' THEN 1 END) as pembayaran_sukses,
        COUNT(CASE WHEN metode = 'Tunai' THEN 1 END) as tunai,
        COUNT(CASE WHEN metode = 'Transfer' THEN 1 END) as transfer,
        COUNT(CASE WHEN metode IN ('KIP', 'kip', 'Kip') THEN 1 END) as kip,
        COUNT(CASE WHEN metode IN ('GNOTA', 'gnota', 'Gnota') THEN 1 END) as gnota,
        COUNT(CASE WHEN metode IN ('BKSM', 'bksm', 'Bksm') THEN 1 END) as bksm
      FROM pembayaran
      WHERE EXTRACT(YEAR FROM tanggal) = $1
    `;
    
    const pembayaranResult = await pool.query(pembayaranQuery, [tahunNum]);
    const pembayaranStats = pembayaranResult.rows[0] || {};

    // 4. Data Tagihan per Tahun - DIPERBAIKI: klarifikasi kolom status
    const tagihanQuery = `
      SELECT 
        COUNT(*) as total_tagihan,
        COALESCE(SUM(ts.nilai), 0) as total_target,
        COALESCE(SUM(ts.terbayar), 0) as total_terbayar,
        COALESCE(SUM(ts.nilai - ts.terbayar), 0) as total_sisa,
        COUNT(CASE WHEN ts.status = 'lunas' THEN 1 END) as tagihan_lunas,
        COUNT(CASE WHEN ts.status = 'cicilan' THEN 1 END) as tagihan_cicilan,
        COUNT(CASE WHEN ts.status = 'belum_lunas' THEN 1 END) as tagihan_belum_lunas
      FROM tagihan_siswa ts
      INNER JOIN data_siswa ds ON ts.siswa_id = ds.id_siswa
      WHERE EXTRACT(YEAR FROM ds.tgl_daftar) = $1
    `;
    
    const tagihanResult = await pool.query(tagihanQuery, [tahunNum]);
    const tagihanStats = tagihanResult.rows[0] || {};

    // 5. Data Bantuan Siswa per Tahun
    const bantuanQuery = `
      SELECT 
        COUNT(*) as total_bantuan,
        COALESCE(SUM(CASE WHEN jumlah > 0 THEN jumlah ELSE 0 END), 0) as total_bantuan_diterima,
        COALESCE(SUM(CASE WHEN jumlah < 0 THEN ABS(jumlah) ELSE 0 END), 0) as total_bantuan_digunakan,
        COUNT(CASE WHEN jenis_bantuan = 'KIP' THEN 1 END) as bantuan_kip,
        COUNT(CASE WHEN jenis_bantuan = 'GNOTA' THEN 1 END) as bantuan_gnota,
        COUNT(CASE WHEN jenis_bantuan = 'BKSM' THEN 1 END) as bantuan_bksm
      FROM bantuan_siswa
      WHERE tahun = $1
    `;
    
    const bantuanResult = await pool.query(bantuanQuery, [tahunNum]);
    const bantuanStats = bantuanResult.rows[0] || {};

    // 6. Rincian Pembayaran per Bulan
    const pembayaranPerBulanQuery = `
      SELECT 
        EXTRACT(MONTH FROM tanggal) as bulan,
        COUNT(*) as jumlah_transaksi,
        COALESCE(SUM(jumlah_bayar), 0) as total_pembayaran
      FROM pembayaran
      WHERE EXTRACT(YEAR FROM tanggal) = $1
      GROUP BY EXTRACT(MONTH FROM tanggal)
      ORDER BY bulan ASC
    `;
    
    const pembayaranPerBulanResult = await pool.query(pembayaranPerBulanQuery, [tahunNum]);
    const pembayaranPerBulan = pembayaranPerBulanResult.rows || [];

    // 7. Rincian Siswa per Jurusan
    const siswaPerJurusanQuery = `
      SELECT 
        j.id,
        j.nama AS nama_jurusan,
        COUNT(ds.id_siswa) as jumlah_siswa,
        COUNT(CASE WHEN ds.jenis_kelamin = 'L' THEN 1 END) as siswa_laki,
        COUNT(CASE WHEN ds.jenis_kelamin = 'P' THEN 1 END) as siswa_perempuan
      FROM jurusan j
      LEFT JOIN data_siswa ds ON j.id = ds.jurusan_id AND EXTRACT(YEAR FROM ds.tgl_daftar) = $1
      GROUP BY j.id, j.nama
      ORDER BY j.nama
    `;
    
    const siswaPerJurusanResult = await pool.query(siswaPerJurusanQuery, [tahunNum]);
    const siswaPerJurusan = siswaPerJurusanResult.rows || [];

    // 8. Rincian Siswa per Alamat (Desa/Kecamatan/Kabupaten)
    // Cek apakah kolom desa, kecamatan, kabupaten ada di data_siswa
    let siswaPerAlamatQuery = '';
    let siswaPerAlamatResult = null;
    
    try {
      // Cek apakah kolom desa, kecamatan, kabupaten ada
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'data_siswa' 
        AND column_name IN ('desa', 'kecamatan', 'kabupaten')
      `);
      
      const hasDesa = columnCheck.rows.some(r => r.column_name === 'desa');
      const hasKecamatan = columnCheck.rows.some(r => r.column_name === 'kecamatan');
      const hasKabupaten = columnCheck.rows.some(r => r.column_name === 'kabupaten');
      
      if (hasDesa && hasKecamatan && hasKabupaten) {
        // Jika ada kolom desa, kecamatan, kabupaten, gunakan itu
        siswaPerAlamatQuery = `
          SELECT 
            COALESCE(ds.kabupaten, 'Tidak Diketahui') as kabupaten,
            COALESCE(ds.kecamatan, 'Tidak Diketahui') as kecamatan,
            COALESCE(ds.desa, 'Tidak Diketahui') as desa,
            ds.alamat, -- Tambahkan ini!
            COUNT(ds.id_siswa) as jumlah_siswa,
            COUNT(CASE WHEN ds.jenis_kelamin = 'L' THEN 1 END) as siswa_laki,
            COUNT(CASE WHEN ds.jenis_kelamin = 'P' THEN 1 END) as siswa_perempuan,
            COUNT(CASE WHEN CAST(ds.kelas_id AS TEXT) IN ('X', '1', '10') THEN 1 END) as kelas_x,
            COUNT(CASE WHEN CAST(ds.kelas_id AS TEXT) IN ('XI', '2', '11') THEN 1 END) as kelas_xi,
            COUNT(CASE WHEN CAST(ds.kelas_id AS TEXT) IN ('XII', '3', '12') THEN 1 END) as kelas_xii
          FROM data_siswa ds
          WHERE EXTRACT(YEAR FROM ds.tgl_daftar) = $1
          GROUP BY ds.kabupaten, ds.kecamatan, ds.desa, ds.alamat -- Tambahkan ds.alamat di GROUP BY
          ORDER BY ds.kabupaten, ds.kecamatan, ds.desa
        `;
      } else {
        // Jika tidak ada, gunakan alamat lengkap dan coba ekstrak informasi
        siswaPerAlamatQuery = `
          SELECT 
            CASE 
              WHEN ds.alamat IS NULL OR ds.alamat = '' THEN 'Tidak Diketahui'
              ELSE LEFT(ds.alamat, 100)
            END as alamat_lengkap,
            COUNT(ds.id_siswa) as jumlah_siswa,
            COUNT(CASE WHEN ds.jenis_kelamin = 'L' THEN 1 END) as siswa_laki,
            COUNT(CASE WHEN ds.jenis_kelamin = 'P' THEN 1 END) as siswa_perempuan,
            COUNT(CASE WHEN CAST(ds.kelas_id AS TEXT) IN ('X', '1', '10') THEN 1 END) as kelas_x,
            COUNT(CASE WHEN CAST(ds.kelas_id AS TEXT) IN ('XI', '2', '11') THEN 1 END) as kelas_xi,
            COUNT(CASE WHEN CAST(ds.kelas_id AS TEXT) IN ('XII', '3', '12') THEN 1 END) as kelas_xii
          FROM data_siswa ds
          WHERE EXTRACT(YEAR FROM ds.tgl_daftar) = $1
          GROUP BY 
            CASE 
              WHEN ds.alamat IS NULL OR ds.alamat = '' THEN 'Tidak Diketahui'
              ELSE LEFT(ds.alamat, 100)
            END
          ORDER BY jumlah_siswa DESC
        `;
      }
      
      siswaPerAlamatResult = await pool.query(siswaPerAlamatQuery, [tahunNum]);
    } catch (err) {
      console.error('Error fetching siswa per alamat:', err);
      // Jika error, set ke array kosong
      siswaPerAlamatResult = { rows: [] };
    }
    
    const siswaPerAlamat = siswaPerAlamatResult.rows || [];

    // 9. Rincian Calon Siswa per Alamat (jika ada kolom desa/kecamatan/kabupaten)
    let calonSiswaPerAlamatQuery = '';
    let calonSiswaPerAlamatResult = null;
    
    try {
      const columnCheckCalon = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'data_calon_siswa' 
        AND column_name IN ('desa', 'kecamatan', 'kabupaten')
      `);
      
      const hasDesaCalon = columnCheckCalon.rows.some(r => r.column_name === 'desa');
      const hasKecamatanCalon = columnCheckCalon.rows.some(r => r.column_name === 'kecamatan');
      const hasKabupatenCalon = columnCheckCalon.rows.some(r => r.column_name === 'kabupaten');
      
      if (hasDesaCalon && hasKecamatanCalon && hasKabupatenCalon) {
        calonSiswaPerAlamatQuery = `
          SELECT 
            COALESCE(dcs.kabupaten, 'Tidak Diketahui') as kabupaten,
            COALESCE(dcs.kecamatan, 'Tidak Diketahui') as kecamatan,
            COALESCE(dcs.desa, 'Tidak Diketahui') as desa,
            COUNT(dcs.id_calon_siswa) as jumlah_calon_siswa,
            COUNT(CASE WHEN dcs.status = 1 THEN 1 END) as diterima,
            COUNT(CASE WHEN dcs.status = 2 THEN 1 END) as ditolak,
            COUNT(CASE WHEN dcs.status = 0 THEN 1 END) as pending
          FROM data_calon_siswa dcs
          WHERE EXTRACT(YEAR FROM dcs.tgl_daftar) = $1
          GROUP BY dcs.kabupaten, dcs.kecamatan, dcs.desa
          ORDER BY dcs.kabupaten, dcs.kecamatan, dcs.desa
        `;
        
        calonSiswaPerAlamatResult = await pool.query(calonSiswaPerAlamatQuery, [tahunNum]);
      }
    } catch (err) {
      console.error('Error fetching calon siswa per alamat:', err);
      calonSiswaPerAlamatResult = { rows: [] };
    }
    
    const calonSiswaPerAlamat = calonSiswaPerAlamatResult ? calonSiswaPerAlamatResult.rows || [] : [];

    // Format response
    const response = {
      success: true,
      tahun: tahunNum,
      statistik: {
        siswa: {
          total: parseInt(siswaStats.total_siswa || 0),
          laki: parseInt(siswaStats.siswa_laki || 0),
          perempuan: parseInt(siswaStats.siswa_perempuan || 0),
          kelas_x: parseInt(siswaStats.kelas_x || 0),
          kelas_xi: parseInt(siswaStats.kelas_xi || 0),
          kelas_xii: parseInt(siswaStats.kelas_xii || 0),
          jurusan_tg: parseInt(siswaStats.jurusan_tg || 0),
          jurusan_rpl: parseInt(siswaStats.jurusan_rpl || 0)
        },
        calon_siswa: {
          total: parseInt(calonSiswaStats.total_calon_siswa || 0),
          diterima: parseInt(calonSiswaStats.diterima || 0),
          ditolak: parseInt(calonSiswaStats.ditolak || 0),
          pending: parseInt(calonSiswaStats.pending || 0)
        },
        pembayaran: {
          total_transaksi: parseInt(pembayaranStats.total_transaksi || 0),
          total_pembayaran: parseFloat(pembayaranStats.total_pembayaran || 0),
          pembayaran_sukses: parseInt(pembayaranStats.pembayaran_sukses || 0),
          tunai: parseInt(pembayaranStats.tunai || 0),
          transfer: parseInt(pembayaranStats.transfer || 0),
          kip: parseInt(pembayaranStats.kip || 0),
          gnota: parseInt(pembayaranStats.gnota || 0),
          bksm: parseInt(pembayaranStats.bksm || 0)
        },
        tagihan: {
          total_tagihan: parseInt(tagihanStats.total_tagihan || 0),
          total_target: parseFloat(tagihanStats.total_target || 0),
          total_terbayar: parseFloat(tagihanStats.total_terbayar || 0),
          total_sisa: parseFloat(tagihanStats.total_sisa || 0),
          tagihan_lunas: parseInt(tagihanStats.tagihan_lunas || 0),
          tagihan_cicilan: parseInt(tagihanStats.tagihan_cicilan || 0),
          tagihan_belum_lunas: parseInt(tagihanStats.tagihan_belum_lunas || 0)
        },
        bantuan: {
          total_bantuan: parseInt(bantuanStats.total_bantuan || 0),
          total_bantuan_diterima: parseFloat(bantuanStats.total_bantuan_diterima || 0),
          total_bantuan_digunakan: parseFloat(bantuanStats.total_bantuan_digunakan || 0),
          bantuan_kip: parseInt(bantuanStats.bantuan_kip || 0),
          bantuan_gnota: parseInt(bantuanStats.bantuan_gnota || 0),
          bantuan_bksm: parseInt(bantuanStats.bantuan_bksm || 0)
        }
      },
      rincian: {
        pembayaran_per_bulan: pembayaranPerBulan.map(item => ({
          bulan: parseInt(item.bulan),
          nama_bulan: new Date(tahunNum, parseInt(item.bulan) - 1).toLocaleString('id-ID', { month: 'long' }),
          jumlah_transaksi: parseInt(item.jumlah_transaksi || 0),
          total_pembayaran: parseFloat(item.total_pembayaran || 0)
        })),
        siswa_per_jurusan: siswaPerJurusan.map(item => ({
          id_jurusan: parseInt(item.id),
          nama_jurusan: item.nama_jurusan || '-',
          jumlah_siswa: parseInt(item.jumlah_siswa || 0),
          siswa_laki: parseInt(item.siswa_laki || 0),
          siswa_perempuan: parseInt(item.siswa_perempuan || 0)
        })),
        siswa_per_alamat: siswaPerAlamat.map(item => ({
          kabupaten: item.kabupaten || item.alamat_lengkap || '-',
          kecamatan: item.kecamatan || '-',
          desa: item.desa || '-',
          alamat: item.alamat || item.alamat_lengkap || '-', // Tambahkan ini
          alamat_lengkap: item.alamat_lengkap || `${item.desa || ''}, ${item.kecamatan || ''}, ${item.kabupaten || ''}`.replace(/^,\s*|,\s*$/g, '') || '-',
          jumlah_siswa: parseInt(item.jumlah_siswa || 0),
          siswa_laki: parseInt(item.siswa_laki || 0),
          siswa_perempuan: parseInt(item.siswa_perempuan || 0),
          kelas_x: parseInt(item.kelas_x || 0),
          kelas_xi: parseInt(item.kelas_xi || 0),
          kelas_xii: parseInt(item.kelas_xii || 0)
        })),
        calon_siswa_per_alamat: calonSiswaPerAlamat.map(item => ({
          kabupaten: item.kabupaten || '-',
          kecamatan: item.kecamatan || '-',
          desa: item.desa || '-',
          jumlah_calon_siswa: parseInt(item.jumlah_calon_siswa || 0),
          diterima: parseInt(item.diterima || 0),
          ditolak: parseInt(item.ditolak || 0),
          pending: parseInt(item.pending || 0)
        }))
      }
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching laporan rekap per tahun:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
});

// Endpoint untuk melihat status tagihan siswa - DIPERBAIKI
app.get('/api/status-tagihan-siswa', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ds.id_siswa, ds.nama, ds.status AS status_siswa, ts.status AS status_tagihan
      FROM data_siswa ds
      LEFT JOIN tagihan_siswa ts ON ds.id_siswa = ts.siswa_id
      WHERE ts.status = 'lunas'
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching status tagihan siswa:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function untuk initialize tagihan siswa
const initializeTagihanSiswa = async (siswaId) => {
  try {
    // Cek apakah tabel tagihan_siswa ada
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tagihan_siswa'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Buat tabel tagihan_siswa
      await pool.query(`
        CREATE TABLE tagihan_siswa (
          id SERIAL PRIMARY KEY,
          siswa_id INTEGER NOT NULL,
          nama_tagihan VARCHAR(100) NOT NULL,
          nilai NUMERIC(15,2) NOT NULL,
          terbayar NUMERIC(15,2) DEFAULT 0,
          jatuh_tempo DATE,
          status VARCHAR(20) DEFAULT 'belum_lunas',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (siswa_id) REFERENCES data_siswa(id_siswa) ON DELETE CASCADE
        );
      `);
    }
    
    // Insert default tagihan untuk siswa baru
    const defaultTagihan = [
      { nama: 'SPP Semester 1', nilai: 500000 },
      { nama: 'Uang Bangunan', nilai: 200000 },
      { nama: 'Seragam Sekolah', nilai: 300000 }
    ];
    
    for (const tagihan of defaultTagihan) {
      await pool.query(
        `INSERT INTO tagihan_siswa (siswa_id, nama_tagihan, nilai, terbayar, jatuh_tempo, status)
         VALUES ($1, $2, $3, 0, $4, 'belum_lunas')`,
        [siswaId, tagihan.nama, tagihan.nilai, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
      );
    }
    
    return true;
  } catch (err) {
    console.error('Error initializing tagihan siswa:', err);
    return false;
  }
};

// Tambah endpoint untuk membuat tabel pembayaran jika belum ada
app.get('/api/check-pembayaran-table', async (req, res) => {
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pembayaran'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      await pool.query(`
        CREATE TABLE pembayaran (
          id SERIAL PRIMARY KEY,
          nama_siswa VARCHAR(100) NOT NULL,
          kelas VARCHAR(50),
          jumlah_bayar NUMERIC(15,2) NOT NULL,
          metode VARCHAR(50) NOT NULL,
          tanggal DATE NOT NULL,
          status VARCHAR(50) NOT NULL,
          keterangan TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      res.json({ message: 'Tabel pembayaran berhasil dibuat', created: true });
    } else {
      res.json({ message: 'Tabel pembayaran sudah ada', created: false });
    }
  } catch (err) {
    console.error('Error checking/creating pembayaran table:', err);
    res.status(500).json({ error: err.message });
  }
});

// Tambah endpoint untuk membuat tabel tagihan_siswa jika belum ada
app.get('/api/check-tagihan-table', async (req, res) => {
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tagihan_siswa'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      await pool.query(`
        CREATE TABLE tagihan_siswa (
          id SERIAL PRIMARY KEY,
          siswa_id INTEGER NOT NULL,
          nama_tagihan VARCHAR(100) NOT NULL,
          nilai NUMERIC(15,2) NOT NULL,
          terbayar NUMERIC(15,2) DEFAULT 0,
          jatuh_tempo DATE,
          status VARCHAR(20) DEFAULT 'belum_lunas',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (siswa_id) REFERENCES data_siswa(id_siswa) ON DELETE CASCADE
        );
      `);
      
      res.json({ message: 'Tabel tagihan_siswa berhasil dibuat', created: true });
    } else {
      res.json({ message: 'Tabel tagihan_siswa sudah ada', created: false });
    }
  } catch (err) {
    console.error('Error checking/creating tagihan_siswa table:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk mendapatkan total pembayaran berdasarkan filter
app.get('/api/pembayaran/total', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        COALESCE(SUM(jumlah_bayar), 0) as total_pembayaran,
        COUNT(*) as total_transaksi
      FROM pembayaran
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (start_date) {
      query += ` AND tanggal >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      query += ` AND tanggal <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching total pembayaran:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint untuk health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint untuk mendapatkan versi API
app.get('/api/version', (req, res) => {
  res.json({ 
    version: '1.0.0',
    name: 'SMK Palapa Pare API',
    description: 'API untuk sistem pendaftaran dan manajemen siswa SMK Palapa Pare'
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'SMK Palapa Pare API Server',
    endpoints: {
      auth: '/api/auth/*',
      siswa: '/api/siswa/*',
      calon_siswa: '/api/calon-siswa/*',
      pembayaran: '/api/pembayaran/*',
      laporan: '/api/laporan/*',
      bantuan: '/api/bantuan-siswa/*',
      tagihan: '/api/tagihan/*'
    }
  });
});

// Endpoint untuk melihat siswa per kelas
app.get('/api/siswa-per-kelas', async (req, res) => {
  try {
    const { kelas_id } = req.query;
    
    console.log('Received kelas_id:', kelas_id, 'type:', typeof kelas_id);
    
    if (!kelas_id) {
      return res.status(400).json({ error: 'kelas_id wajib diisi' });
    }
    
    // Konversi kelas_id ke format yang sesuai dengan database
    let kelasValue;
    const kelasStr = String(kelas_id).trim();
    
    // Mapping untuk kelas_id
    const kelasMapping = {
      '1': '1',   // Kelas X
      '2': '1',   // Kelas X
      '10': '1',  // Kelas X alternative
      '11': '2',  // Kelas XI alternative
      '3': '2',   // Kelas XI
      '4': '2',   // Kelas XI
      '5': '3',   // Kelas XII 1
      '6': '3'    // Kelas XII 2
    };
    
    kelasValue = kelasMapping[kelasStr] || kelasStr;
    
    console.log('Mapped kelas_id to:', kelasValue);
    
    // Query dengan pengecekan tipe data yang fleksibel
    const query = `
      SELECT 
        ds.*,
        j.nama AS nama_jurusan
      FROM data_siswa ds
      LEFT JOIN jurusan j ON ds.jurusan_id = j.id
      WHERE CAST(ds.kelas_id AS TEXT) = $1
      ORDER BY ds.nama ASC
    `;
    
    const result = await pool.query(query, [kelasValue]);
    
    console.log(`Found ${result.rows.length} students for kelas_id=${kelasValue}`);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching siswa per kelas:', err);
    res.status(500).json({ error: err.message });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});
