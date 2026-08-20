'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import {
  FileSpreadsheet,
  UploadCloud,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Users,
  Trash2,
  Building,
  Plus,
  Download,
  Edit,
  X,
  Eye
} from 'lucide-react';

export default function AdminDashboard() {
  const [classes, setClasses] = useState<any[]>([]);
  const [newClass, setNewClass] = useState({
    name: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sweet Notification Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  // User Accounts active tab state
  const [activeUserTab, setActiveUserTab] = useState<'all' | 'admin' | 'wali_kelas' | 'koordinator' | 'ketua_kelas'>('all');

  // Manual creation states
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'ketua_kelas',
    class_id: ''
  });
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // Import modal states
  const [importTargetClass, setImportTargetClass] = useState<any>(null);
  const [importModalFile, setImportModalFile] = useState<File | null>(null);
  const [importModalUploading, setImportModalUploading] = useState(false);
  const [importModalResult, setImportModalResult] = useState<any>(null);
  const [importDragActive, setImportDragActive] = useState(false);

  // Edit user states
  const [editTargetUser, setEditTargetUser] = useState<any>(null);
  const [editPassword, setEditPassword] = useState('');
  const [selectedEditStudentId, setSelectedEditStudentId] = useState('');
  const [editUserError, setEditUserError] = useState('');
  const [editUserSuccess, setEditUserSuccess] = useState('');

  // Delete user confirmation state
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<any>(null);

  // Edit class states
  const [editTargetClass, setEditTargetClass] = useState<any>(null);
  const [editClassName, setEditClassName] = useState('');
  const [classEditError, setClassEditError] = useState('');
  const [classEditSuccess, setClassEditSuccess] = useState('');

  // Delete class confirmation state
  const [confirmDeleteClass, setConfirmDeleteClass] = useState<any>(null);

  // View students class states
  const [viewStudentsClass, setViewStudentsClass] = useState<any>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Helper to show custom premium notifications
  const showNotification = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchData = async () => {
    try {
      const classesRes = await fetch('/api/classes');
      const classesData = await classesRes.json();
      if (classesRes.ok) {
        setClasses(classesData.classes || []);
      }

      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      if (usersRes.ok) {
        setUsers(usersData.users || []);
      }

      // Fetch all students to display in the dropdown selection
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .order('name');
      setStudents(studentsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Download template for a single class
  const downloadClassTemplate = (className: string) => {
    const templateData = [
      {
        'NIS': '2024001',
        'Nama Siswa': 'Ahmad Dani'
      },
      {
        'NIS': '2024002',
        'Nama Siswa': 'Ayu Lestari'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [{ wch: 12 }, { wch: 25 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, className.substring(0, 31));
    XLSX.writeFile(workbook, `Template_Siswa_${className.replace(/\s+/g, '_')}.xlsx`);
    showNotification('success', 'Template Diunduh', `Template siswa kelas ${className} berhasil diunduh.`);
  };

  // Download multi-sheet template containing all classes
  const downloadAllClassesTemplate = () => {
    if (classes.length === 0) {
      showNotification('error', 'Gagal Mengunduh', 'Belum ada kelas terdaftar. Tambah kelas terlebih dahulu.');
      return;
    }

    const workbook = XLSX.utils.book_new();

    classes.forEach((c) => {
      const templateData = [
        {
          'NIS': '2024001',
          'Nama Siswa': 'Ahmad Dani'
        },
        {
          'NIS': '2024002',
          'Nama Siswa': 'Ayu Lestari'
        }
      ];
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      worksheet['!cols'] = [{ wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, worksheet, c.name.substring(0, 31));
    });

    XLSX.writeFile(workbook, `Template_Semua_Siswa.xlsx`);
    showNotification('success', 'Template Diunduh', 'Template multi-sheet untuk seluruh kelas berhasil diunduh.');
  };

  const handleClassExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importModalFile || !importTargetClass) return;
    setImportModalUploading(true);
    setImportModalResult(null);

    const formData = new FormData();
    formData.append('file', importModalFile);
    
    // If specific classId is provided, append it.
    // Otherwise, it will process all sheets globally.
    if (importTargetClass.id) {
      formData.append('classId', importTargetClass.id);
    }

    try {
      const res = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor file.');

      setImportModalResult({ success: true, message: data.message, details: data.details });
      setImportModalFile(null);
      showNotification('success', 'Import Berhasil', `Data siswa ${importTargetClass.name} berhasil diimpor.`);
      fetchData(); // Refresh classes, users, and students
    } catch (err: any) {
      setImportModalResult({ success: false, error: err.message });
      showNotification('error', 'Import Gagal', err.message);
    } finally {
      setImportModalUploading(false);
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat akun');

      showNotification('success', 'Akun Berhasil Dibuat', `Akun ${data.user.username} (${data.user.role}) telah aktif.`);
      setNewUser({ username: '', password: '', full_name: '', role: 'ketua_kelas', class_id: '' });
      setSelectedStudentId('');
      setTimeout(() => {
        setIsCreateUserModalOpen(false);
        setUserSuccess('');
      }, 1000);
      fetchData();
    } catch (err: any) {
      setUserError(err.message);
      showNotification('error', 'Gagal Membuat Akun', err.message);
    }
  };

  // Handle Edit User Submit
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditUserError('');
    setEditUserSuccess('');

    try {
      const payload: any = {
        id: editTargetUser.id,
        username: editTargetUser.username,
        full_name: editTargetUser.full_name,
        role: editTargetUser.role,
        class_id: editTargetUser.class_id || null
      };

      if (editPassword) {
        payload.password = editPassword;
      }

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui akun');

      showNotification('success', 'Akun Diperbarui', 'Detail akun telah berhasil disimpan.');
      setEditPassword('');
      setSelectedEditStudentId('');
      setTimeout(() => {
        setEditTargetUser(null);
        setEditUserSuccess('');
      }, 1000);
      fetchData();
    } catch (err: any) {
      setEditUserError(err.message);
      showNotification('error', 'Gagal Memperbarui Akun', err.message);
    }
  };

  // Handle Create Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name) return;

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClass.name }),
      });

      if (res.ok) {
        setNewClass({ name: '' });
        showNotification('success', 'Kelas Ditambahkan', 'Kelas baru berhasil dibuat.');
        fetchData();
      } else {
        const data = await res.json();
        showNotification('error', 'Gagal Membuat Kelas', data.error || 'Terjadi kesalahan.');
      }
    } catch (err: any) {
      showNotification('error', 'Gagal Membuat Kelas', err.message);
    }
  };

  // Handle Edit Class Submit
  const handleEditClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassEditError('');
    setClassEditSuccess('');

    try {
      const res = await fetch('/api/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTargetClass.id,
          name: editClassName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui kelas');

      showNotification('success', 'Kelas Diperbarui', 'Nama kelas telah berhasil disimpan.');
      setTimeout(() => {
        setEditTargetClass(null);
        setClassEditSuccess('');
      }, 1000);
      fetchData();
    } catch (err: any) {
      setClassEditError(err.message);
      showNotification('error', 'Gagal Memperbarui Kelas', err.message);
    }
  };

  // Trigger Delete Confirmation Modal for Class
  const handleDeleteClassClick = (c: any) => {
    setConfirmDeleteClass(c);
  };

  // Execute Class Deletion
  const executeDeleteClass = async (id: string) => {
    try {
      const res = await fetch(`/api/classes?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kelas');

      showNotification('success', 'Kelas Berhasil Dihapus', 'Kelas dan seluruh data siswa terikat telah dihapus.');
      fetchData();
    } catch (err: any) {
      showNotification('error', 'Gagal Menghapus Kelas', err.message);
    }
  };

  // Trigger Delete Confirmation Modal for User
  const handleDeleteUserClick = (user: any) => {
    setConfirmDeleteUser(user);
  };

  // Execute User Deletion
  const executeDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus akun');

      showNotification('success', 'Akun Berhasil Dihapus', 'Akun pengguna telah dihapus dari sistem.');
      fetchData();
    } catch (err: any) {
      showNotification('error', 'Gagal Menghapus Akun', err.message);
    }
  };

  // Filter users by active tab role
  const filteredUsers = users.filter((u) => {
    if (activeUserTab === 'all') return true;
    return u.role === activeUserTab;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: '12px', fontWeight: 500 }}>Memuat Data Admin...</span>
      </div>
    );
  }

  return (
    <div className="admin-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Styles for animations & tab hover */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .user-tab-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .user-tab-btn:hover {
          background-color: rgba(0, 0, 0, 0.04) !important;
          color: var(--text-primary) !important;
        }
      `}} />

      {/* Sweet Premium Notification Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          pointerEvents: 'none'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            borderRadius: '16px',
            padding: '16px 24px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            minWidth: '320px',
            maxWidth: '450px'
          }}>
            <div style={{
              padding: '10px',
              background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: toast.type === 'success' ? '#10b981' : '#ef4444',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{toast.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      <header>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Dashboard Admin</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manajemen pengguna dan data kelas sistem absensi.</p>
      </header>

      {/* Summary Stats Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', background: 'var(--accent-indigo-bg)', borderRadius: '12px', color: 'var(--accent-indigo)' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Akun Pengguna</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{users.length}</h2>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', background: 'var(--accent-emerald-bg)', borderRadius: '12px', color: 'var(--accent-emerald)' }}>
            <Building size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Kelas</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{classes.length}</h2>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', background: 'var(--accent-sky-bg)', borderRadius: '12px', color: 'var(--accent-sky)' }}>
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Siswa Terdaftar</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-sky)' }}>
              {classes.reduce((sum, c) => sum + (c.students?.[0]?.count || 0), 0)}
            </h2>
          </div>
        </div>
      </div>

      {/* Quick Guide Card */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building size={20} color="var(--accent-sky)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Panduan Cepat Kelola Data</h3>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.5' }}>
          <p>Ikuti langkah berikut untuk memulai tahun ajaran atau mengelola data kelas:</p>
          <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong>Tambah Kelas</strong>: Input nama kelas melalui form di bagian bawah halaman.
            </li>
            <li>
              <strong>Unduh Template</strong>: Klik tombol <em>"Template Excel"</em> pada baris kelas yang bersangkutan untuk mengunduh template khusus.
            </li>
            <li>
              <strong>Import Siswa</strong>: Klik <em>"Import Siswa"</em>, unggah file Excel yang sudah diisi, dan klik sinkronisasi untuk menyimpan otomatis.
            </li>
            <li>
              <strong>Buat Akun Pengguna</strong>: Buat akun untuk Ketua Kelas (mobile), Wali Kelas (web), dan hubungkan ke kelas masing-masing. Wali Kelas dan Ketua Kelas otomatis terisi di tabel kelas.
            </li>
          </ol>
        </div>
      </div>

      {/* Table Section: Managed Accounts with Tabs */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} color="var(--accent-indigo)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Daftar Akun Pengguna System</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIsCreateUserModalOpen(true)} className="btn btn-indigo" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              <Plus size={14} /> Buat Akun Baru
            </button>
            <button onClick={fetchData} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              <RefreshCw size={14} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Dynamic Category Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'Semua Akun' },
            { id: 'admin', label: 'Admin' },
            { id: 'wali_kelas', label: 'Wali Kelas' },
            { id: 'koordinator', label: 'Koordinator' },
            { id: 'ketua_kelas', label: 'Ketua Kelas' }
          ].map((tab) => {
            const isActive = activeUserTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveUserTab(tab.id as any)}
                className="user-tab-btn"
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: isActive ? 'var(--accent-indigo-bg)' : 'transparent',
                  color: isActive ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Nama Lengkap</th>
                <th>Role</th>
                <th>Kelas Terikat</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    Belum ada akun terdaftar untuk kategori ini.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-sky)' }}>{u.username}</td>
                    <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                    <td>
                      <span className="badge badge-role">
                        {u.role === 'ketua_kelas' ? 'Ketua Kelas (Mobile)' : u.role === 'wali_kelas' ? 'Wali Kelas' : u.role === 'koordinator' ? 'Koordinator' : 'Admin'}
                      </span>
                    </td>
                    <td>{u.classes?.name || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditTargetUser(u);
                            setEditPassword('');
                            const matchingStudent = students.find(s => s.class_id === u.class_id && s.name === u.full_name);
                            setSelectedEditStudentId(matchingStudent ? matchingStudent.id : '');
                          }}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUserClick(u)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Section: Managed Classes */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building size={20} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Daftar Kelas & Wali Kelas</h3>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <form onSubmit={handleCreateClass} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                style={{ width: '180px', padding: '8px 12px', fontSize: '0.85rem' }}
                placeholder="Nama Kelas (ex: X RPL 1)"
                value={newClass.name}
                onChange={(e) => setNewClass({ name: e.target.value })}
                required
              />
              <button type="submit" className="btn btn-emerald" style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                <Plus size={14} /> Tambah Kelas
              </button>
            </form>

            <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }}></div>

            <button
              onClick={downloadAllClassesTemplate}
              className="btn btn-outline"
              style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
              title="Unduh template Excel dengan sheet untuk setiap kelas"
            >
              <Download size={14} /> Template Semua Siswa
            </button>

            <button
              onClick={() => {
                setImportTargetClass({ id: '', name: 'Semua Kelas' }); // id: '' indicates global multi-sheet import
                setImportModalFile(null);
                setImportModalResult(null);
              }}
              className="btn btn-emerald"
              style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
            >
              <UploadCloud size={14} /> Import Semua Siswa
            </button>
          </div>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nama Kelas</th>
                <th>Wali Kelas</th>
                <th>Ketua Kelas</th>
                <th>Jumlah Siswa</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    Belum ada data kelas. Tambah kelas baru di sebelah kanan atas terlebih dahulu.
                  </td>
                </tr>
              ) : (
                classes.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                    <td>{c.homeroom_teacher_name || 'Belum Ditentukan'}</td>
                    <td style={{ fontWeight: 500, color: 'var(--accent-indigo)' }}>
                      {c.leader_name || 'Belum Ditentukan'}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-sky)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                        {c.students?.[0]?.count || 0} Siswa
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setViewStudentsClass(c);
                            setStudentSearchQuery('');
                          }}
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-sky)', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                        >
                          <Eye size={14} /> Rincian
                        </button>
                        <button
                          onClick={() => {
                            setEditTargetClass(c);
                            setEditClassName(c.name);
                            setClassEditError('');
                            setClassEditSuccess('');
                          }}
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => downloadClassTemplate(c.name)}
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title={`Unduh Template Excel Siswa untuk ${c.name}`}
                        >
                          <Download size={14} /> Template Excel
                        </button>
                        <button
                          onClick={() => {
                            setImportTargetClass(c);
                            setImportModalFile(null);
                            setImportModalResult(null);
                          }}
                          className="btn btn-emerald"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <UploadCloud size={14} /> Import Siswa
                        </button>
                        <button
                          onClick={() => handleDeleteClassClick(c)}
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup Modal: Create User Account */}
      {isCreateUserModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: 'var(--shadow)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserPlus size={20} color="var(--accent-indigo)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Buat Akun Baru</h3>
              </div>
              <button 
                onClick={() => { setIsCreateUserModalOpen(false); setUserError(''); setUserSuccess(''); setSelectedStudentId(''); }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Row 1: Role Akun & Pilih Kelas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                  <label className="form-label">Role Akun</label>
                  <select
                    className="form-select"
                    value={newUser.role}
                    onChange={(e) => {
                      setNewUser({ ...newUser, role: e.target.value as any, class_id: '', full_name: '' });
                      setSelectedStudentId('');
                    }}
                  >
                    <option value="ketua_kelas">Ketua Kelas (Mobile)</option>
                    <option value="wali_kelas">Wali Kelas (Web)</option>
                    <option value="koordinator">Koordinator Keagamaan</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                  <label className="form-label">Pilih Kelas</label>
                  <select
                    className="form-select"
                    value={newUser.class_id}
                    onChange={(e) => {
                      setNewUser({ ...newUser, class_id: e.target.value, full_name: '' });
                      setSelectedStudentId('');
                    }}
                    disabled={newUser.role !== 'ketua_kelas' && newUser.role !== 'wali_kelas'}
                    required={newUser.role === 'ketua_kelas' || newUser.role === 'wali_kelas'}
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Nama Lengkap / Pilih Siswa */}
              {newUser.role === 'ketua_kelas' ? (
                <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                  <label className="form-label">Pilih Siswa (Sebagai Ketua Kelas)</label>
                  <select
                    className="form-select"
                    value={selectedStudentId}
                    onChange={(e) => {
                      const studentId = e.target.value;
                      setSelectedStudentId(studentId);
                      const student = students.find(s => s.id === studentId);
                      setNewUser({ ...newUser, full_name: student ? student.name : '' });
                    }}
                    disabled={!newUser.class_id}
                    required
                  >
                    <option value="">{newUser.class_id ? '-- Pilih Siswa --' : '-- Pilih Kelas Terlebih Dahulu --'}</option>
                    {students
                      .filter(s => s.class_id === newUser.class_id)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.nis})</option>
                      ))
                    }
                  </select>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama Lengkap Pengguna"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Row 3: Username & Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ketua_xrpl1"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="******"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setIsCreateUserModalOpen(false); setUserError(''); setUserSuccess(''); setSelectedStudentId(''); }} style={{ flex: 1 }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-indigo" style={{ flex: 1 }}>
                  <UserPlus size={16} /> Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup Modal: Import Students */}
      {importTargetClass && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: 'var(--shadow)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileSpreadsheet size={20} color="var(--accent-emerald)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Import Siswa - {importTargetClass.name}
                </h3>
              </div>
              <button 
                onClick={() => { setImportTargetClass(null); setImportModalFile(null); setImportModalResult(null); }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', textAlign: 'left' }}>
              {importTargetClass.id 
                ? 'Unduh template Excel khusus untuk kelas ini, masukkan NIS dan nama siswa, kemudian unggah kembali di sini.'
                : 'Unduh template Excel untuk semua kelas. Setiap sheet di dalamnya mewakili satu kelas terdaftar. Isi data siswa kemudian unggah di sini.'
              }
            </p>

            {/* Template Downloader */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px 16px', 
              background: 'rgba(12, 166, 120, 0.05)', 
              border: '1px solid var(--accent-emerald-border)', 
              borderRadius: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Download size={18} color="var(--accent-emerald)" />
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Template Excel Siswa</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {importTargetClass.id ? `Nama Sheet: ${importTargetClass.name}` : 'Multi-sheet untuk seluruh kelas'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  if (importTargetClass.id) {
                    downloadClassTemplate(importTargetClass.name);
                  } else {
                    downloadAllClassesTemplate();
                  }
                }}
                className="btn btn-outline" 
                style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald-border)', background: '#fff' }}
              >
                Unduh Template
              </button>
            </div>

            <form onSubmit={handleClassExcelUpload} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Drag and Drop area */}
              <div 
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setImportDragActive(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setImportDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragleave") setImportDragActive(false); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setImportDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) setImportModalFile(e.dataTransfer.files[0]); }}
                style={{
                  border: `2px dashed ${importModalFile ? 'var(--accent-emerald)' : importDragActive ? 'var(--accent-indigo)' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  background: importModalFile ? 'rgba(12, 166, 120, 0.03)' : importDragActive ? 'rgba(112, 72, 232, 0.03)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  marginBottom: '16px'
                }}
                onClick={() => document.getElementById('modal-file-upload-input')?.click()}
              >
                <input 
                  id="modal-file-upload-input"
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={(e) => setImportModalFile(e.target.files?.[0] || null)} 
                  style={{ display: 'none' }}
                />
                <FileSpreadsheet size={36} color={importModalFile ? 'var(--accent-emerald)' : 'var(--text-secondary)'} style={{ marginBottom: '10px' }} />
                {importModalFile ? (
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>{importModalFile.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {(importModalFile.size / 1024).toFixed(1)} KB - Siap diunggah
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      Klik atau Tarik file Excel di sini
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Mendukung format .xlsx dan .xls
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setImportTargetClass(null); setImportModalFile(null); setImportModalResult(null); }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-emerald" disabled={importModalUploading || !importModalFile} style={{ flex: 1 }}>
                  {importModalUploading ? <RefreshCw className="animate-spin" size={16} /> : <UploadCloud size={16} />} 
                  {importModalUploading ? 'Memproses...' : 'Upload & Import'}
                </button>
              </div>
            </form>

            {importModalResult && (
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: importModalResult.success ? '#ecfdf5' : '#fef2f2', border: `1px solid ${importModalResult.success ? '#d1fae5' : '#fee2e2'}` }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: importModalResult.success ? '#059669' : '#dc2626', fontWeight: 500, fontSize: '0.85rem' }}>
                  {importModalResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {importModalResult.success ? importModalResult.message : importModalResult.error}
                </p>
                {importModalResult.success && importModalResult.details && (
                  <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#047857', textAlign: 'left' }}>
                    <p>Berhasil memproses:</p>
                    <ul style={{ paddingLeft: '16px', marginTop: '2px' }}>
                      <li>Siswa Baru/Update: {importModalResult.details.totalStudentsProcessed}</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup Modal: Edit User Account */}
      {editTargetUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: 'var(--shadow)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit size={20} color="var(--accent-indigo)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Akun Pengguna</h3>
              </div>
              <button 
                onClick={() => { setEditTargetUser(null); setSelectedEditStudentId(''); }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Row 1: Role Akun & Pilih Kelas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                  <label className="form-label">Role Akun</label>
                  <select
                    className="form-select"
                    value={editTargetUser.role || 'ketua_kelas'}
                    onChange={(e) => {
                      setEditTargetUser({ ...editTargetUser, role: e.target.value as any, class_id: '', full_name: '' });
                      setSelectedEditStudentId('');
                    }}
                  >
                    <option value="ketua_kelas">Ketua Kelas (Mobile)</option>
                    <option value="wali_kelas">Wali Kelas (Web)</option>
                    <option value="koordinator">Koordinator Keagamaan</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                  <label className="form-label">Pilih Kelas</label>
                  <select
                    className="form-select"
                    value={editTargetUser.class_id || ''}
                    onChange={(e) => {
                      setEditTargetUser({ ...editTargetUser, class_id: e.target.value, full_name: '' });
                      setSelectedEditStudentId('');
                    }}
                    disabled={editTargetUser.role !== 'ketua_kelas' && editTargetUser.role !== 'wali_kelas'}
                    required={editTargetUser.role === 'ketua_kelas' || editTargetUser.role === 'wali_kelas'}
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Nama Lengkap / Pilih Siswa */}
              {editTargetUser.role === 'ketua_kelas' ? (
                <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                  <label className="form-label">Pilih Siswa (Sebagai Ketua Kelas)</label>
                  <select
                    className="form-select"
                    value={selectedEditStudentId}
                    onChange={(e) => {
                      const studentId = e.target.value;
                      setSelectedEditStudentId(studentId);
                      const student = students.find(s => s.id === studentId);
                      setEditTargetUser({ ...editTargetUser, full_name: student ? student.name : '' });
                    }}
                    disabled={!editTargetUser.class_id}
                    required
                  >
                    <option value="">{editTargetUser.class_id ? '-- Pilih Siswa --' : '-- Pilih Kelas Terlebih Dahulu --'}</option>
                    {students
                      .filter(s => s.class_id === editTargetUser.class_id)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.nis})</option>
                      ))
                    }
                  </select>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editTargetUser.full_name || ''}
                    onChange={(e) => setEditTargetUser({ ...editTargetUser, full_name: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Row 3: Username & Password */}
              <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTargetUser.username || ''}
                  onChange={(e) => setEditTargetUser({ ...editTargetUser, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                <label className="form-label">Password Baru (Kosongkan jika tidak diubah)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Masukkan password baru jika ingin mengubah"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setEditTargetUser(null); setSelectedEditStudentId(''); }} style={{ flex: 1 }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-indigo" style={{ flex: 1 }}>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup Modal: Edit Class Info */}
      {editTargetClass && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: 'var(--shadow)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building size={20} color="var(--accent-emerald)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Informasi Kelas</h3>
              </div>
              <button 
                onClick={() => setEditTargetClass(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditClassSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {classEditError && <p style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', background: 'var(--accent-rose-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--accent-rose-border)', textAlign: 'left' }}>{classEditError}</p>}
              {classEditSuccess && <p style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', background: 'var(--accent-emerald-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--accent-emerald-border)', textAlign: 'left' }}>{classEditSuccess}</p>}

              <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                <label className="form-label">Nama Kelas</label>
                <input
                  type="text"
                  className="form-input"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditTargetClass(null)} style={{ flex: 1 }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-emerald" style={{ flex: 1 }}>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup Modal: Class Student Details */}
      {viewStudentsClass && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            boxShadow: 'var(--shadow)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={20} color="var(--accent-sky)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Daftar Siswa - {viewStudentsClass.name}
                </h3>
              </div>
              <button 
                onClick={() => setViewStudentsClass(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Cari nama atau NIS siswa..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="custom-table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>No</th>
                    <th>NIS</th>
                    <th>Nama Siswa</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.class_id === viewStudentsClass.id).length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                        Belum ada data siswa di kelas ini.
                      </td>
                    </tr>
                  ) : (
                    students
                      .filter(s => s.class_id === viewStudentsClass.id)
                      .filter(s => 
                        s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                        s.nis.includes(studentSearchQuery)
                      )
                      .map((student, index) => (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td style={{ fontWeight: 600, color: 'var(--accent-sky)' }}>{student.nis}</td>
                          <td style={{ fontWeight: 500 }}>{student.name}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setViewStudentsClass(null)} style={{ minWidth: '100px' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for User */}
      {confirmDeleteUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: 'var(--shadow)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              margin: '0 auto',
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              borderRadius: '50%',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trash2 size={32} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hapus Akun Pengguna</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Apakah Anda yakin ingin menghapus akun <strong>{confirmDeleteUser.username}</strong> ({confirmDeleteUser.full_name})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setConfirmDeleteUser(null)} 
                style={{ flex: 1 }}
              >
                Batal
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => {
                  executeDeleteUser(confirmDeleteUser.id);
                  setConfirmDeleteUser(null);
                }} 
                style={{ flex: 1 }}
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Class */}
      {confirmDeleteClass && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: 'var(--shadow)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              margin: '0 auto',
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              borderRadius: '50%',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trash2 size={32} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hapus Kelas</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Apakah Anda yakin ingin menghapus kelas <strong>{confirmDeleteClass.name}</strong>? Seluruh data siswa dan riwayat presensi yang terikat pada kelas ini akan **terhapus secara permanen**.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setConfirmDeleteClass(null)} 
                style={{ flex: 1 }}
              >
                Batal
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => {
                  executeDeleteClass(confirmDeleteClass.id);
                  setConfirmDeleteClass(null);
                }} 
                style={{ flex: 1 }}
              >
                Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
