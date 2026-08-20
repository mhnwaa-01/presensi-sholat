import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './pages/Login';
import Beranda from './pages/Beranda';
import Presensi from './pages/Presensi';
import Riwayat from './pages/Riwayat';
import About from './pages/About';
import BottomNav from './components/BottomNav';
import { ShieldCheck, LogOut } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('beranda');

  // Check saved session on startup
  useEffect(() => {
    const savedSession = localStorage.getItem('ketua_session');
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (err) {
        localStorage.removeItem('ketua_session');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ketua_session');
    setSession(null);
  };

  if (!session) {
    return <Login onLoginSuccess={(userSession) => setSession(userSession)} />;
  }

  return (
    <div id="root">
      {/* Top Mobile App Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'var(--accent-pastel-green-bg)',
            border: '1px solid var(--accent-pastel-green-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-pastel-green)'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Aplikasi Presensi Sholat SMKN 2 Barru
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--accent-pastel-green)', fontWeight: 600 }}>
              Anda login sebagai : Ketua Kelas {session.class_name}
            </p>
          </div>
        </div>


      </header>

      {/* Main Tab Screen Content */}
      <main className="mobile-container">
        {activeTab === 'beranda' && <Beranda session={session} setActiveTab={setActiveTab} />}
        {activeTab === 'presensi' && <Presensi session={session} />}
        {activeTab === 'riwayat' && <Riwayat session={session} />}
        {activeTab === 'about' && <About session={session} onLogout={handleLogout} />}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
