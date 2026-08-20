# Sistem Informasi Presensi Sholat Siswa 🕌
**Full-Stack Mobile App (Android APK) & Web Dashboard (Next.js + Supabase)**

Sistem Informasi Presensi Sholat Siswa dirancang khusus untuk memfasilitasi pencatatan dan rekapitulasi kehadiran sholat siswa (Dhuha, Dhuhur, Ashar). Sistem ini terdiri dari:
1. **Mobile App (Android APK)**: Khusus untuk **Ketua Kelas** dengan desain Bottom Navigation Bar & real-time jam sholat.
2. **Web Dashboard**: Panel rekapitulasi berbasis role (**Wali Kelas**, **Koordinator Keagamaan**, **Admin**) dengan fitur **Import Data Siswa via Excel (.xlsx / .csv)** dan Vercel deployment ready.
3. **Database Utama**: Supabase PostgreSQL dengan Row Level Security (RLS) policies.

---

## 🏗️ ARSITEKTUR & SKEMA DATABASE SUPABASE

### 1. Eksekusi SQL Schema
Buka **SQL Editor** pada Dashboard Supabase Anda, lalu jalankan file `supabase/schema.sql`:

```sql
-- Tabel Kelas
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    homeroom_teacher_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Pengguna (Admin, Koordinator, Wali Kelas, Ketua Kelas)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'koordinator', 'wali_kelas', 'ketua_kelas')),
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Siswa
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Presensi Sholat
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    prayer_type VARCHAR(20) NOT NULL CHECK (prayer_type IN ('dhuha', 'dhuhur', 'ashar')),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sholat', 'tidak')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_prayer_date UNIQUE (date, prayer_type, student_id)
);
```

> **Seed Data Testing**: Eksekusi file `supabase/seed.sql` untuk membuat data pengujian (Akun Admin `admin`, Koordinator `koordinator`, Wali Kelas `walikelas_xrpl1`, Ketua Kelas `ketua_xrpl1` dengan password default: `password123`).

---

## 💻 1. WEB DASHBOARD (NEXT.JS - VERCEL READY)

### Fitur Berdasarkan Role Access:
- 👑 **Admin**:
  - **Import Data Siswa via Excel**: Upload `.xlsx` / `.csv` dengan header (`NIS`, `Nama Siswa`, `Kelas`, `Wali Kelas`). Otomatis membuat kelas baru dan meng-upsert data siswa ke Supabase.
  - **Manajemen Akun**: Pembuat akun login untuk Ketua Kelas (Mobile App) dan Wali Kelas (Web).
  - **Manajemen Kelas**: Tambah dan edit daftar kelas & Wali Kelas.
- 🕌 **Koordinator Keagamaan**:
  - Rekapitulasi global presensi seluruh kelas.
  - Multi-filter berdasarkan Tanggal, Waktu Sholat (Dhuha, Dhuhur, Ashar), dan Kelas.
  - Widget statistik ringkasan kehadiran siswa.
- 👨‍🏫 **Wali Kelas**:
  - Rekapitulasi presensi khusus siswa perwaliannya (locked `class_id`).
  - Fitur **Export to Excel (`.xlsx`)** & **Cetak Laporan (Print / PDF)** dengan tampilan print khusus.

### Menjalankan Web Dashboard Secara Lokal:
```bash
cd web
npm install
npm run dev
```
Akses di browser: `http://localhost:3000`

### Variabel Lingkungan (`web/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=presensi-sholat-super-secret-key-2026
```

### Deployment ke Vercel:
1. Push folder `web` ke repository Git (GitHub / GitLab).
2. Hubungkan repository ke Vercel dashboard.
3. Masukkan Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`).
4. Klik **Deploy**!

---

## 📱 2. MOBILE APP (ANDROID APK - KETUA KELAS)

Aplikasi mobile didesain khusus untuk **Ketua Kelas** dengan antarmuka **Bottom Navigation Bar**:
- 🏠 **Beranda**: Jam digital real-time, rekomendasi waktu sholat aktif, info Wali Kelas, & ringkasan jumlah siswa.
- 📝 **Presensi**: Input tanggal (default hari ini), dropdown waktu sholat, toggle button status ("Sholat" / "Tidak"), tombol "Semua Sholat", & submit ke Supabase.
- 📜 **Riwayat**: Histori log presensi kelas yang sudah disubmit.
- ℹ️ **About**: Informasi sistem & tombol Keluar Akun.

### Menjalankan Mobile App di Browser (Local Preview):
```bash
cd mobile
npm install
npm run dev
```
Akses di browser: `http://localhost:3001`

### Build ke Android APK Native:
1. Pastikan Anda memiliki **Android Studio** & Android SDK terinstall.
2. Atur file `mobile/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Compile bundle web & sinkronkan dengan Capacitor:
   ```bash
   cd mobile
   npm run build
   npx cap add android
   npx cap copy android
   npx cap open android
   ```
4. Di Android Studio, pilih menu **Build > Build Bundle(s) / APK(s) > Build APK(s)** untuk menghasilkan file `.apk` siap install di Smartphone Android Ketua Kelas.

---

## 📄 FORMAT IMPORT EXCEL UNTUK ADMIN

File Excel yang diupload oleh Admin pada Web Dashboard mendukung header kolom berikut (tidak peka huruf besar/kecil):

| NIS | Nama Siswa | Kelas | Wali Kelas |
|---|---|---|---|
| 2024001 | Ahmad Dani | X RPL 1 | Budi Santoso, S.Pd. |
| 2024002 | Ayu Lestari | X RPL 1 | Budi Santoso, S.Pd. |
| 2024003 | Bima Sakti | XI TKJ 2 | Siti Rahmawati, S.Kom. |

Sistem akan otomatis mendeteksi kolom, membuat kelas yang belum ada, dan memasukkan data siswa ke Supabase!
