'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, LogIn, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk');
      }

      const role = data.user.role;
      if (role === 'admin') {
        router.push('/dashboard/admin');
      } else if (role === 'koordinator') {
        router.push('/dashboard/koordinator');
      } else if (role === 'wali_kelas') {
        router.push('/dashboard/wali-kelas');
      } else {
        setError('Akun ini adalah Ketua Kelas. Silakan gunakan Aplikasi Mobile APK.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(circle at top left, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
    }}>
      {/* Styles to override browser autofocus outline and add visual animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .login-input {
          transition: all 0.2s ease-in-out;
        }
        .login-input:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2) !important;
          background: rgba(15, 23, 42, 0.8) !important;
        }
        .login-btn {
          transition: all 0.2s ease-in-out;
        }
        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -10px rgba(16, 185, 129, 0.5);
        }
        .login-btn:active {
          transform: translateY(0);
        }
      `}} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px 32px',
        background: 'rgba(30, 41, 59, 0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
          }}>
            <Shield size={30} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.025em' }}>
            Presensi Sholat Siswa
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.4' }}>
            Web Dashboard Manajemen & Rekapitulasi
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 14px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '12px',
            color: '#fb7185',
            fontSize: '0.85rem',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: '#cbd5e1', fontWeight: 500, marginBottom: '6px' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
              <input
                type="text"
                className="form-input login-input"
                style={{
                  paddingLeft: '42px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  height: '46px',
                  fontSize: '0.9rem'
                }}
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: '#cbd5e1', fontWeight: 500, marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
              <input
                type="password"
                className="form-input login-input"
                style={{
                  paddingLeft: '42px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  height: '46px',
                  fontSize: '0.9rem'
                }}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-emerald login-btn"
            style={{
              width: '100%',
              height: '46px',
              fontSize: '0.95rem',
              borderRadius: '12px',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600
            }}
            disabled={loading}
          >
            {loading ? (
              'Memproses...'
            ) : (
              <>
                <LogIn size={18} /> Masuk ke Dashboard
              </>
            )}
          </button>
        </form>

        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '0.8rem',
          color: '#94a3b8',
        }}>
          <Sparkles size={14} color="#f59e0b" />
          <span>Akses Role: Admin, Koordinator & Wali Kelas</span>
        </div>
      </div>
    </div>
  );
}
