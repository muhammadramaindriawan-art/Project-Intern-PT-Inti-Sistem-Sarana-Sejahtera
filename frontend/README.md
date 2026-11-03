# SMK Palapa Pare - Frontend

## Alur Login dan Sign Up

### 1. Sign Up (Pendaftaran)
1. User mengklik tab "Sign Up"
2. User mengisi form pendaftaran:
   - First Name
   - Last Name
   - Username
   - Email
   - Password
   - Confirm Password
3. User mengklik "Create Account"
4. Sistem mengirim OTP ke email user
5. User diarahkan ke halaman verifikasi OTP

### 2. Verifikasi OTP
1. User memasukkan 6-digit OTP yang diterima via email
2. User mengklik "Verify OTP"
3. Jika OTP benar:
   - Akun user diaktifkan
   - User diarahkan kembali ke halaman login
   - Pesan sukses ditampilkan: "Account verified successfully! You can now login with your email and password."
4. Jika OTP salah atau expired:
   - Pesan error ditampilkan
   - User dapat request OTP baru

### 3. Login
1. User memasukkan email dan password yang sudah didaftarkan
2. User mengklik "Sign In"
3. Jika kredensial benar:
   - User masuk ke dashboard
4. Jika kredensial salah:
   - Pesan error ditampilkan

### 4. Fitur Tambahan
- **Resend OTP**: User dapat request OTP baru jika tidak menerima email
- **Back to Login/Sign Up**: Tombol untuk kembali ke form sebelumnya
- **Success Message**: Pesan sukses yang dapat ditutup manual
- **Auto-hide Message**: Pesan sukses otomatis hilang setelah 5 detik

## Keamanan
- Password di-hash menggunakan bcrypt
- OTP berlaku selama 5 menit
- JWT token untuk autentikasi
- Email verification wajib sebelum login

## Testing
Untuk testing, OTP akan ditampilkan di console backend jika email service tidak dikonfigurasi.

## Struktur File
- `Login.js` - Halaman login dan sign up dengan OTP verification
- `App.js` - Routing dan state management
- `Dashboard.js` - Halaman utama setelah login
- `Sidebar.js` - Navigasi sidebar
- Dan komponen lainnya...
