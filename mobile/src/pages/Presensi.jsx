import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, CheckCircle2, XCircle, Save, Check, RefreshCw, Sparkles } from 'lucide-react';

export default function Presensi({ session }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [prayerType, setPrayerType] = useState('dhuha');
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({}); // { [studentId]: 'sholat' | 'tidak' }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch students & existing attendance records for the selected date & prayer
  useEffect(() => {
    if (!session?.class_id) return;

    async function loadData() {
      setLoading(true);
      setMessage(null);

      try {
        // 1. Fetch Students in Class
        const { data: sData } = await supabase
          .from('students')
          .select('id, nis, name')
          .eq('class_id', session.class_id)
          .order('name');

        const studentList = sData || [];
        setStudents(studentList);

        // 2. Fetch Existing Attendance Records if submitted previously
        const { data: aData } = await supabase
          .from('attendance')
          .select('student_id, status')
          .eq('class_id', session.class_id)
          .eq('date', date)
          .eq('prayer_type', prayerType);

        // Map initial state (defaulting to 'sholat')
        const initialState = {};
        const existingMap = new Map((aData || []).map(a => [a.student_id, a.status]));

        studentList.forEach(s => {
          initialState[s.id] = existingMap.get(s.id) || 'sholat';
        });

        setAttendanceState(initialState);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session, date, prayerType]);

  // Toggle single student status
  const handleToggleStatus = (studentId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Bulk mark all students as 'sholat'
  const handleMarkAllSholat = () => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = 'sholat';
    });
    setAttendanceState(updated);
  };

  // Submit attendance records to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const recordsToUpsert = students.map(s => ({
        date: date,
        prayer_type: prayerType,
        student_id: s.id,
        class_id: session.class_id,
        status: attendanceState[s.id] || 'sholat',
        created_by: session.id,
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(recordsToUpsert, { onConflict: 'date, prayer_type, student_id' });

      if (error) throw error;

      setMessage({ type: 'success', text: `Presensi Sholat ${prayerType.toUpperCase()} tanggal ${date} berhasil disimpan!` });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan presensi.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Selector Card */}
      <div className="card" style={{ border: '1px solid var(--border-card)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
          Form Input Presensi Sholat
        </h3>

        {/* Date Selector */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
            Tanggal Presensi
          </label>
          <div style={{ position: 'relative' }}>
            <Calendar size={18} color="var(--accent-pastel-green)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                background: '#f8fafc',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Prayer Dropdown */}
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
            Pilih Waktu Sholat
          </label>
          <select
            value={prayerType}
            onChange={(e) => setPrayerType(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: '#f8fafc',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          >
            <option value="dhuha" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>🌅 Sholat Dhuha</option>
            <option value="dhuhur" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>☀️ Sholat Dhuhur</option>
            <option value="ashar" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>🌤️ Sholat Ashar</option>
          </select>
        </div>
      </div>

      {/* Message Notification Banner */}
      {message && (
        <div style={{
          padding: '14px',
          borderRadius: '14px',
          background: message.type === 'success' ? 'var(--accent-pastel-green-bg)' : 'var(--accent-pastel-rose-bg)',
          border: `1px solid ${message.type === 'success' ? 'var(--accent-pastel-green-border)' : 'var(--accent-pastel-rose-border)'}`,
          color: message.type === 'success' ? 'var(--accent-pastel-green)' : 'var(--accent-pastel-rose)',
          fontSize: '0.85rem',
          fontWeight: 600,
          textAlign: 'center',
        }}>
          {message.text}
        </div>
      )}

      {/* Students Attendance List Card */}
      <div className="card" style={{ border: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Daftar Siswa {session?.class_name}
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total: {students.length} Siswa
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllSholat}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--accent-pastel-green-bg)',
              border: '1px solid var(--accent-pastel-green-border)',
              color: 'var(--accent-pastel-green)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={14} /> Semua Sholat
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Memuat daftar siswa kelas...
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Belum ada data siswa di kelas ini.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {students.map((student, index) => {
              const currentStatus = attendanceState[student.id] || 'sholat';

              return (
                <div
                  key={student.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: '20px' }}>
                      {index + 1}.
                    </span>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {student.name}
                      </h4>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        NIS: {student.nis}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Status Buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(student.id, 'sholat')}
                      className={`toggle-btn ${currentStatus === 'sholat' ? 'toggle-sholat' : ''}`}
                      style={{ opacity: currentStatus === 'sholat' ? 1 : 0.5 }}
                    >
                      <CheckCircle2 size={16} /> Sholat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(student.id, 'tidak')}
                      className={`toggle-btn ${currentStatus === 'tidak' ? 'toggle-tidak' : ''}`}
                      style={{ opacity: currentStatus === 'tidak' ? 1 : 0.5 }}
                    >
                      <XCircle size={16} /> Tidak
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || students.length === 0}
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
        {submitting ? 'Menyimpan Presensi...' : <><Save size={20} /> Simpan Presensi Ke Database</>}
      </button>
    </div>
  );
}
