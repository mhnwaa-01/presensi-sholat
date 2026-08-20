import React from 'react';
import { Info, ShieldCheck, Smartphone, Database, LogOut } from 'lucide-react';

export default function About({ session, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card" style={{ textAlign: 'center', padding: '30px 20px', border: '1px solid var(--border-card)' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--accent-pastel-purple-bg)',
          border: '1px solid var(--accent-pastel-purple-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
          color: 'var(--accent-pastel-purple)'
        }}>
          <ShieldCheck size={28} />
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Aplikasi Presensi Sholat SMKN 2 barru
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Developer : Muh Hidayat Nurwahid, S.Pd,.M.Pd.
        </p>
      </div>

      {/* Info Details Card */}
      <div className="card" style={{ border: '1px solid var(--border-card)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
          Spesifikasi Aplikasi
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Smartphone size={18} color="var(--accent-pastel-green)" />
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Platform</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Android Native App (Capacitor PWA Build)</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database size={18} color="var(--accent-pastel-blue)" />
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Database Backend</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supabase Cloud PostgreSQL</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Info size={18} color="var(--accent-pastel-yellow)" />
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Akses Khusus</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ketua Kelas ({session?.class_name})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '14px',
          background: 'var(--accent-pastel-rose-bg)',
          border: '1px solid var(--accent-pastel-rose-border)',
          color: 'var(--accent-pastel-rose)',
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <LogOut size={18} /> Keluar dari Akun Ketua Kelas
      </button>
    </div>
  );
}
