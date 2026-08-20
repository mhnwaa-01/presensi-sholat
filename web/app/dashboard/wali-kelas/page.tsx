'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import {
  UserCheck,
  Calendar,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  Award,
  FileSpreadsheet,
  PieChart
} from 'lucide-react';

export default function WaliKelasPage() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPrayer, setSelectedPrayer] = useState<string>('all');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSessionUser(data.user);
        }
      });
  }, []);

  // Helper to get array of dates between start and end
  const getDatesInRange = (startStr: string, endStr: string) => {
    const dates = [];
    let current = new Date(startStr);
    const end = new Date(endStr);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Fetch Class & Attendance Data
  useEffect(() => {
    if (!sessionUser) return;

    const classId = sessionUser.class_id;

    async function loadClassData() {
      setLoading(true);
      try {
        // Fetch Class Info
        if (classId) {
          const { data: cData } = await supabase
            .from('classes')
            .select('*')
            .eq('id', classId)
            .single();
          setClassInfo(cData);
        }

        // Fetch Students in Class
        let queryStudents = supabase.from('students').select('*').order('name');
        if (classId) queryStudents = queryStudents.eq('class_id', classId);
        const { data: sData } = await queryStudents;
        setStudents(sData || []);

        // Fetch Attendance Log
        let queryAtt = supabase
          .from('attendance')
          .select(`
            id,
            date,
            prayer_type,
            status,
            student_id,
            students ( nis, name )
          `)
          .gte('date', startDate)
          .lte('date', endDate);

        if (classId) queryAtt = queryAtt.eq('class_id', classId);
        if (selectedPrayer !== 'all') queryAtt = queryAtt.eq('prayer_type', selectedPrayer);

        const { data: aData } = await queryAtt;
        setAttendance(aData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadClassData();
  }, [sessionUser, startDate, endDate, selectedPrayer]);

  // Export to Excel
  const handleExportExcel = () => {
    const dates = getDatesInRange(startDate, endDate);
    const exportData: any[] = [];

    students.forEach(s => {
      dates.forEach(date => {
        const dhuha = attendance.find(a => a.student_id === s.id && a.date === date && a.prayer_type === 'dhuha');
        const dhuhur = attendance.find(a => a.student_id === s.id && a.date === date && a.prayer_type === 'dhuhur');
        const ashar = attendance.find(a => a.student_id === s.id && a.date === date && a.prayer_type === 'ashar');

        exportData.push({
          'NIS': s.nis,
          'Nama Siswa': s.name,
          'Kelas': classInfo?.name || 'Perwalian',
          'Tanggal': date,
          'Sholat Dhuha': dhuha ? (dhuha.status === 'sholat' ? 'Sholat' : 'Tidak') : 'Belum Input',
          'Sholat Dhuhur': dhuhur ? (dhuhur.status === 'sholat' ? 'Sholat' : 'Tidak') : 'Belum Input',
          'Sholat Ashar': ashar ? (ashar.status === 'sholat' ? 'Sholat' : 'Tidak') : 'Belum Input',
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Sholat');
    XLSX.writeFile(workbook, `Rekap_Presensi_Sholat_${classInfo?.name || 'Kelas'}_${startDate}_to_${endDate}.xlsx`);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Stats calculation
  const totalStudents = students.length;
  const totalRecords = attendance.length;
  const totalSholat = attendance.filter(a => a.status === 'sholat').length;
  const totalTidak = attendance.filter(a => a.status === 'tidak').length;
  const percentageSholat = totalRecords > 0 ? ((totalSholat / totalRecords) * 100).toFixed(1) : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Title & Class Info */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Rekapitulasi Presensi Perwalian Kelas
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Kelas: <strong style={{ color: 'var(--accent-emerald)' }}>{classInfo?.name || 'Perwalian'}</strong> | Wali Kelas: <strong style={{ color: 'var(--text-primary)' }}>{classInfo?.homeroom_teacher_name || sessionUser?.full_name}</strong>
          </p>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExportExcel} className="btn btn-emerald">
            <Download size={16} /> Export to Excel (.xlsx)
          </button>
          <button onClick={handlePrint} className="btn btn-indigo">
            <Printer size={16} /> Cetak Laporan (Print/PDF)
          </button>
        </div>
      </div>

      {/* Stats Summary Widgets */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', background: 'var(--accent-indigo-bg)', borderRadius: '12px', color: 'var(--accent-indigo)' }}>
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Presensi Input</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalRecords}</h2>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', background: 'var(--accent-emerald-bg)', borderRadius: '12px', color: 'var(--accent-emerald)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Siswa Sholat</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{totalSholat}</h2>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', background: 'var(--accent-rose-bg)', borderRadius: '12px', color: 'var(--accent-rose)' }}>
            <XCircle size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tidak Sholat</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-rose)' }}>{totalTidak}</h2>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', background: 'var(--accent-amber-bg)', borderRadius: '12px', color: 'var(--accent-amber)' }}>
            <PieChart size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tingkat Kehadiran</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{percentageSholat}%</h2>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card no-print" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} color="var(--text-secondary)" />
            <label className="form-label" style={{ margin: 0 }}>Mulai:</label>
            <input
              type="date"
              className="form-input"
              style={{ width: '150px', padding: '6px 12px' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label className="form-label" style={{ margin: 0 }}>Selesai:</label>
            <input
              type="date"
              className="form-input"
              style={{ width: '150px', padding: '6px 12px' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="form-label" style={{ margin: 0 }}>Filter Sholat:</label>
            <select
              className="form-select"
              style={{ width: '150px', padding: '6px 12px' }}
              value={selectedPrayer}
              onChange={(e) => setSelectedPrayer(e.target.value)}
            >
              <option value="all">Semua Waktu</option>
              <option value="dhuha">Dhuha</option>
              <option value="dhuhur">Dhuhur</option>
              <option value="ashar">Ashar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Rekap Table */}
      <div className="glass-card">
        {/* Printable Header Details */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            LAPORAN PRESENSI SHOLAT SISWA - {classInfo?.name || 'KELAS'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Periode: {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s.d. {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Siswa: {totalStudents} Siswa
          </p>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>No</th>
                <th style={{ width: '120px' }}>NIS</th>
                <th>Nama Siswa</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Tanggal</th>
                <th style={{ textAlign: 'center' }}>Sholat Dhuha</th>
                <th style={{ textAlign: 'center' }}>Sholat Dhuhur</th>
                <th style={{ textAlign: 'center' }}>Sholat Ashar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Memuat data siswa perwalian...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    Belum ada siswa di kelas perwalian ini.
                  </td>
                </tr>
              ) : (
                (() => {
                  const dates = getDatesInRange(startDate, endDate);
                  let globalIdx = 0;
                  
                  return students.flatMap((student) => 
                    dates.map((date) => {
                      globalIdx++;
                      const dhuha = attendance.find(a => a.student_id === student.id && a.date === date && a.prayer_type === 'dhuha');
                      const dhuhur = attendance.find(a => a.student_id === student.id && a.date === date && a.prayer_type === 'dhuhur');
                      const ashar = attendance.find(a => a.student_id === student.id && a.date === date && a.prayer_type === 'ashar');

                      return (
                        <tr key={`${student.id}-${date}`}>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{globalIdx}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{student.nis}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</td>
                          <td style={{ textAlign: 'center', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                          
                          {/* Dhuha */}
                          <td style={{ textAlign: 'center' }}>
                            {dhuha ? (
                              <span className={`badge ${dhuha.status === 'sholat' ? 'badge-sholat' : 'badge-tidak'}`}>
                                {dhuha.status === 'sholat' ? 'Sholat' : 'Tidak'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>-</span>
                            )}
                          </td>

                          {/* Dhuhur */}
                          <td style={{ textAlign: 'center' }}>
                            {dhuhur ? (
                              <span className={`badge ${dhuhur.status === 'sholat' ? 'badge-sholat' : 'badge-tidak'}`}>
                                {dhuhur.status === 'sholat' ? 'Sholat' : 'Tidak'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>-</span>
                            )}
                          </td>

                          {/* Ashar */}
                          <td style={{ textAlign: 'center' }}>
                            {ashar ? (
                              <span className={`badge ${ashar.status === 'sholat' ? 'badge-sholat' : 'badge-tidak'}`}>
                                {ashar.status === 'sholat' ? 'Sholat' : 'Tidak'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  );
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
