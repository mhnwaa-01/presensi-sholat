'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  FileSpreadsheet,
  LogOut,
  UserCheck,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#94a3b8',
      }}>
        Loading Dashboard...
      </div>
    );
  }

  const roleNames: Record<string, string> = {
    admin: 'Administrator Utama',
    koordinator: 'Koordinator Keagamaan',
    wali_kelas: 'Wali Kelas',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Sidebar Navigation */}
      <aside className="sidebar-nav" style={{
        width: '260px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        flexShrink: 0,
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-indigo))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Presensi Sholat</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SMKN 2 Barru</p>
          </div>
        </div>

        {/* User Card */}
        <div style={{
          marginTop: '20px',
          padding: '12px 14px',
          background: 'var(--bg-primary)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--accent-indigo-bg)',
            color: 'var(--accent-indigo)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}>
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name}
            </p>
            <span className="badge badge-role" style={{ fontSize: '0.7rem', padding: '2px 6px', marginTop: '2px' }}>
              {roleNames[user?.role] || user?.role}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', paddingLeft: '8px', marginBottom: '4px', textTransform: 'uppercase' }}>
            Menu Utama
          </p>

          {/* Wali Kelas View */}
          {(user?.role === 'admin' || user?.role === 'wali_kelas') && (
            <Link
              href="/dashboard/wali-kelas"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: pathname === '/dashboard/wali-kelas' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                background: pathname === '/dashboard/wali-kelas' ? 'var(--accent-emerald-bg)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <UserCheck size={18} />
              <span>Rekap Wali Kelas</span>
            </Link>
          )}

          {/* Koordinator View */}
          {(user?.role === 'admin' || user?.role === 'koordinator') && (
            <Link
              href="/dashboard/koordinator"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: pathname === '/dashboard/koordinator' ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                background: pathname === '/dashboard/koordinator' ? 'var(--accent-indigo-bg)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <FileSpreadsheet size={18} />
              <span>Rekap Koordinator</span>
            </Link>
          )}

          {/* Admin View */}
          {user?.role === 'admin' && (
            <Link
              href="/dashboard/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: pathname === '/dashboard/admin' ? 'var(--accent-sky)' : 'var(--text-secondary)',
                background: pathname === '/dashboard/admin' ? 'var(--accent-sky-bg)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <Users size={18} />
              <span>Panel Admin</span>
            </Link>
          )}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="btn btn-danger"
          style={{ width: '100%', marginTop: 'auto' }}
        >
          <LogOut size={16} /> Keluar
        </button>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Top Header */}
        <header className="header-bar" style={{
          height: '64px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {pathname.includes('admin') ? 'Panel Admin' : pathname.includes('koordinator') ? 'Rekapitulasi Koordinator' : 'Rekapitulasi Wali Kelas'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Page Children */}
        <main style={{ padding: '32px', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
