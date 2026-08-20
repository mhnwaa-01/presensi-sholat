import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { History, Calendar, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function Riwayat({ session }) {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!session?.class_id) return;
    setLoading(true);

    try {
      // Query raw attendance logs for this class
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          date,
          prayer_type,
          status,
          students ( name )
        `)
        .eq('class_id', session.class_id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Group logs by date + prayer_type
      const grouped = {};
      (data || []).forEach(row => {
        const key = `${row.date}_${row.prayer_type}`;
        if (!grouped[key]) {
          grouped[key] = {
            date: row.date,
            prayer_type: row.prayer_type,
            sholatCount: 0,
            tidakCount: 0,
            total: 0,
          };
        }
        grouped[key].total += 1;
        if (row.status === 'sholat') grouped[key].sholatCount += 1;
        else grouped[key].tidakCount += 1;
      });

      setHistoryLogs(Object.values(grouped));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [session]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-card)' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Riwayat Presensi Kelas
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Rekap histori presensi yang telah disubmit
          </p>
        </div>
        <button
          onClick={fetchHistory}
          style={{
            padding: '8px',
            borderRadius: '10px',
            background: 'var(--accent-pastel-green-bg)',
            border: '1px solid var(--accent-pastel-green-border)',
            color: 'var(--accent-pastel-green)',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Memuat riwayat presensi...
        </div>
      ) : historyLogs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', border: '1px solid var(--border-card)' }}>
          <History size={36} style={{ marginBottom: '10px', opacity: 0.5 }} />
          <p style={{ fontSize: '0.9rem' }}>Belum ada riwayat presensi yang tersimpan.</p>
        </div>
      ) : (
        historyLogs.map((log, index) => (
          <div key={index} className="card" style={{ padding: '16px 20px', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--accent-pastel-green)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {log.date}
                </span>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'var(--accent-pastel-purple-bg)',
                color: 'var(--accent-pastel-purple)',
                border: '1px solid var(--accent-pastel-purple-border)',
              }}>
                Sholat {log.prayer_type}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{
                padding: '10px',
                borderRadius: '10px',
                background: 'var(--accent-pastel-green-bg)',
                border: '1px solid var(--accent-pastel-green-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <CheckCircle2 size={16} color="var(--accent-pastel-green)" />
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sholat</p>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-pastel-green)' }}>{log.sholatCount} Siswa</h4>
                </div>
              </div>

              <div style={{
                padding: '10px',
                borderRadius: '10px',
                background: 'var(--accent-pastel-rose-bg)',
                border: '1px solid var(--accent-pastel-rose-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <XCircle size={16} color="var(--accent-pastel-rose)" />
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tidak Sholat</p>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-pastel-rose)' }}>{log.tidakCount} Siswa</h4>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
