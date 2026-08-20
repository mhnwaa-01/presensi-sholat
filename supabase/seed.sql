-- ========================================================
-- SEED DATA FOR TESTING & INITIAL SETUP
-- Passwords in this seed are bcrypt hashes for "password123"
-- Hash: $2a$10$7rQxR1L3iGgZ5.6oH2bCveB3yJ0fF8G/gR8/nKqFz0zQz0zQz0zQz (or plain test fallback)
-- ========================================================

-- Insert Sample Classes
INSERT INTO classes (id, name, homeroom_teacher_name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'X RPL 1', 'Budi Santoso, S.Pd.'),
    ('22222222-2222-2222-2222-222222222222', 'XI TKJ 2', 'Siti Rahmawati, S.Kom.'),
    ('33333333-3333-3333-3333-333333333333', 'XII MM 1', 'Ahmad Fauzi, M.T.')
ON CONFLICT (name) DO NOTHING;

-- Insert Sample Users for Each Role
-- Password for all seed users is: password123
INSERT INTO users (id, username, password_hash, full_name, role, class_id) VALUES
    -- 1. Admin
    ('a1111111-1111-1111-1111-111111111111', 'admin', '$2a$10$4a2uQZzjEMOvaGr.fk0o4O9pP8y7/NaojOuR9pZKXA4npiosGmeQC', 'Administrator Utama', 'admin', NULL),
    
    -- 2. Koordinator Keagamaan
    ('b2222222-2222-2222-2222-222222222222', 'koordinator', '$2a$10$4a2uQZzjEMOvaGr.fk0o4O9pP8y7/NaojOuR9pZKXA4npiosGmeQC', 'Ust. Abdullah Hafiz, S.Ag.', 'koordinator', NULL),
    
    -- 3. Wali Kelas (X RPL 1)
    ('c3333333-3333-3333-3333-333333333333', 'walikelas_xrpl1', '$2a$10$4a2uQZzjEMOvaGr.fk0o4O9pP8y7/NaojOuR9pZKXA4npiosGmeQC', 'Budi Santoso, S.Pd.', 'wali_kelas', '11111111-1111-1111-1111-111111111111'),
    
    -- 4. Ketua Kelas (X RPL 1 Mobile User)
    ('d4444444-4444-4444-4444-444444444444', 'ketua_xrpl1', '$2a$10$4a2uQZzjEMOvaGr.fk0o4O9pP8y7/NaojOuR9pZKXA4npiosGmeQC', 'Muhammad Rizky', 'ketua_kelas', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (username) DO NOTHING;

-- Insert Sample Students for X RPL 1
INSERT INTO students (nis, name, class_id) VALUES
    ('2024001', 'Ahmad Dani', '11111111-1111-1111-1111-111111111111'),
    ('2024002', 'Ayu Lestari', '11111111-1111-1111-1111-111111111111'),
    ('2024003', 'Bagus Pratama', '11111111-1111-1111-1111-111111111111'),
    ('2024004', 'Citra Kirana', '11111111-1111-1111-1111-111111111111'),
    ('2024005', 'Dedi Kurniawan', '11111111-1111-1111-1111-111111111111'),
    ('2024006', 'Eka Putri', '11111111-1111-1111-1111-111111111111'),
    ('2024007', 'Faris Hidayat', '11111111-1111-1111-1111-111111111111'),
    ('2024008', 'Gita Gutawa', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (nis) DO NOTHING;

-- Set default Ketua Kelas (Class Leader) for X RPL 1
UPDATE classes SET leader_id = (SELECT id FROM students WHERE nis = '2024001' LIMIT 1) WHERE id = '11111111-1111-1111-1111-111111111111';
