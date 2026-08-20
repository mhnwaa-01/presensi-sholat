import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Users, UserCheck, ShieldCheck, Sun, Moon, Sunrise, Sparkles } from 'lucide-react';

export default function Beranda({ session, setActiveTab }) {
  const [time, setTime] = useState(new Date());
  const [studentCount, setStudentCount] = useState(0);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch total student count for this class
  useEffect(() => {
    if (!session?.class_id) return;
    supabase
      .from('students')
      .select('id', { count: 'exact' })
      .eq('class_id', session.class_id)
      .then(({ count }) => {
        setStudentCount(count || 0);
      });
  }, [session]);

  // Determine current active prayer recommendation based on local time
  const getActivePrayerRecommendation = () => {
    const hours = time.getHours();
    if (hours >= 6 && hours < 11) {
      return { name: 'Sholat Dhuha', icon: Sunrise, color: 'var(--accent-pastel-yellow)', bg: 'var(--accent-pastel-yellow-bg)', desc: 'Waktu utama presensi Sholat Dhuha pagi ini.' };
    } else if (hours >= 11 && hours < 15) {
      return { name: 'Sholat Dhuhur', icon: Sun, color: 'var(--accent-pastel-green)', bg: 'var(--accent-pastel-green-bg)', desc: 'Waktu presensi Sholat Dhuhur berjamaah.' };
    } else if (hours >= 15 && hours < 18) {
      return { name: 'Sholat Ashar', icon: Moon, color: 'var(--accent-pastel-purple)', bg: 'var(--accent-pastel-purple-bg)', desc: 'Waktu presensi Sholat Ashar sore hari.' };
    }
    return { name: 'Sholat Dhuha / Dhuhur', icon: Clock, color: 'var(--accent-pastel-blue)', bg: 'var(--accent-pastel-blue-bg)', desc: 'Jadwal presensi sholat siswa.' };
  };

  const activePrayer = getActivePrayerRecommendation();
  const PrayerIcon = activePrayer.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner Card with Digital Clock */}
      <div className="card" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        textAlign: 'center',
        padding: '24px 20px',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '99px',
          background: 'var(--accent-pastel-green-bg)',
          border: '1px solid var(--accent-pastel-green-border)',
          fontSize: '0.75rem',
          color: 'var(--accent-pastel-green)',
          fontWeight: 600,
          marginBottom: '12px',
        }}>
          <Clock size={14} /> WAKTU SAAT INI
        </div>

        {/* Big Digital Clock */}
        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          letterSpacing: '2px',
          color: 'var(--accent-pastel-blue)',
          margin: '4px 0',
        }}>
          {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </h1>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {/* Current Active Prayer Alert Card */}
        <div style={{
          marginTop: '18px',
          padding: '14px',
          borderRadius: '14px',
          background: '#f8fafc',
          border: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left',
        }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: activePrayer.bg,
            color: activePrayer.color,
            border: `1px solid var(--border-card)`
          }}>
            <PrayerIcon size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {activePrayer.name}
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {activePrayer.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Class Overview Card */}
      <div className="card" style={{ border: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Informasi Kelas
          </h3>
          <span style={{
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'var(--accent-pastel-purple-bg)',
            color: 'var(--accent-pastel-purple)',
            border: '1px solid var(--accent-pastel-purple-border)',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}>
            {session?.class_name || 'X RPL 1'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Total Students */}
          <div style={{
            padding: '14px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid var(--border-card)',
          }}>
            <Users size={20} color="var(--accent-pastel-blue)" style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jumlah Siswa</p>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{studentCount} Siswa</h2>
          </div>

          {/* Wali Kelas Name */}
          <div style={{
            padding: '14px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid var(--border-card)',
          }}>
            <UserCheck size={20} color="var(--accent-pastel-green)" style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wali Kelas</p>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.homeroom_teacher || 'Budi Santoso'}
            </h2>
          </div>
        </div>

        {/* Ketua Kelas Info */}
        <div style={{
          marginTop: '12px',
          padding: '12px 14px',
          borderRadius: '12px',
          background: '#f8fafc',
          border: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="var(--accent-pastel-yellow)" />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ketua Kelas</p>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{session?.full_name}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <button
        onClick={() => setActiveTab('presensi')}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '16px',
          background: 'var(--accent-pastel-green)',
          color: '#ffffff',
          fontSize: '1rem',
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <Sparkles size={20} /> Input Presensi Hari Ini
      </button>
    </div>
  );
}
