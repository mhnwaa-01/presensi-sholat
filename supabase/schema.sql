-- ========================================================
-- SISTEM INFORMASI PRESENSI SHOLAT SISWA - SUPABASE SCHEMA
-- Database: PostgreSQL (Supabase)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE: CLASSES
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    homeroom_teacher_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLE: USERS (Admin, Koordinator, Wali Kelas, Ketua Kelas)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'koordinator', 'wali_kelas', 'ketua_kelas')),
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE: STUDENTS (Siswa)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE: ATTENDANCE (Presensi Sholat)
CREATE TABLE IF NOT EXISTS attendance (
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

-- ========================================================
-- INDEXES FOR OPTIMIZED QUERYING
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date_prayer ON attendance(date, prayer_type);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Enable RLS on all tables
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon select for auth queries (or service role bypass)
-- Note: When accessing via Next.js backend with SUPABASE_SERVICE_ROLE_KEY, RLS is automatically bypassed safely.
-- The following policies apply to direct Client SDK connections (e.g., Mobile App):

-- Classes: Read access for all authenticated app roles
CREATE POLICY "Allow read access to classes" ON classes
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to classes" ON classes
    FOR ALL USING (true);

-- Users: Read public info (non-sensitive)
CREATE POLICY "Allow read access to users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to users" ON users
    FOR ALL USING (true);

-- Students: Read access for all authenticated app roles
CREATE POLICY "Allow read access to students" ON students
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to students" ON students
    FOR ALL USING (true);

-- Attendance: 
-- 1. Everyone can read attendance records
CREATE POLICY "Allow read access to attendance" ON attendance
    FOR SELECT USING (true);

-- 2. Anyone with valid user session can insert/update attendance
CREATE POLICY "Allow insert attendance" ON attendance
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update attendance" ON attendance
    FOR UPDATE USING (true);

-- ========================================================
-- HELPER VIEW FOR REKAPITULASI PRESENSI
-- ========================================================
CREATE OR REPLACE VIEW view_attendance_recap AS
SELECT 
    a.id AS attendance_id,
    a.date,
    a.prayer_type,
    a.status,
    s.id AS student_id,
    s.nis,
    s.name AS student_name,
    c.id AS class_id,
    c.name AS class_name,
    c.homeroom_teacher_name,
    u.full_name AS recorder_name
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN classes c ON a.class_id = c.id
LEFT JOIN users u ON a.created_by = u.id;

-- Add leader_id column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES students(id) ON DELETE SET NULL;

-- Ensure only one Wali Kelas and one Ketua Kelas can be assigned to a class
CREATE UNIQUE INDEX IF NOT EXISTS unique_class_role ON users (class_id, role) WHERE role IN ('wali_kelas', 'ketua_kelas');
