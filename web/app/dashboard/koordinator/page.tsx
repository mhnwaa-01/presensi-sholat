'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import {
  FileSpreadsheet,
  Filter,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  PieChart,
  RefreshCw,
  Download,
  Printer
} from 'lucide-react';

export default function KoordinatorPage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPrayer, setSelectedPrayer] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Classes list
  useEffect(() => {
    supabase.from('classes')
      .select('*, users(full_name, role)')
      .order('name')
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((c: any) => {
            const teacher = c.users?.find((u: any) => u.role === 'wali_kelas')?.full_name || 'Belum Ditentukan';
            return {
              id: c.id,
              name: c.name,
              homeroom_teacher_name: teacher
            };
          });
          setClasses(mapped);
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

  // Fetch Students & Attendance Data
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students (with class details)
      let queryStudents = supabase
        .from('students')
        .select('*, classes ( name, homeroom_teacher_name )')
        .order('name');
      
      if (selectedClass !== 'all') {
        queryStudents = queryStudents.eq('class_id', selectedClass);
      }
      const { data: sData, error: sErr } = await queryStudents;
      if (sErr) throw sErr;
      setStudents(sData || []);

      // 2. Fetch Attendance Logs
      let queryAtt = supabase
        .from('attendance')
        .select(`
          id,
          date,
          prayer_type,
          status,
          student_id,
          class_id,
          users ( full_name )
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (selectedClass !== 'all') {
        queryAtt = queryAtt.eq('class_id', selectedClass);
      }
      if (selectedPrayer !== 'all') {
        queryAtt = queryAtt.eq('prayer_type', selectedPrayer);
      }

      const { data: aData, error: aErr } = await queryAtt;
      if (aErr) throw aErr;
      setAttendance(aData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate, selectedPrayer, selectedClass]);

  // Filtered Students by Search Query
  const filteredStudents = students.filter(student => {
    const sName = student.name?.toLowerCase() || '';
    const sNis = student.nis?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return sName.includes(query) || sNis.includes(query);
  });

  // Export to Excel
  const handleExportExcel = () => {
    const dates = getDatesInRange(startDate, endDate);
    const exportData: any[] = [];

    filteredStudents.forEach(s => {
      dates.forEach(date => {
        const dhuha = attendance.find(a => a.student_id === s.id && a.date === date && a.prayer_type === 'dhuha');
        const dhuhur = attendance.find(a => a.student_id === s.id && a.date === date && a.prayer_type === 'dhuhur');
        const ashar = attendance.find(a => a.student_id === s.id && a.date === date && a.prayer_type === 'ashar');

        exportData.push({
          'NIS': s.nis,
          'Nama Siswa': s.name,
          'Kelas': s.classes?.name || '-',
          'Wali Kelas': classes.find(c => c.id === s.class_id)?.homeroom_teacher_name || '-',
          'Tanggal': date,
          'Sholat Dhuha': dhuha ? (dhuha.status === 'sholat' ? 'Sholat' : 'Tidak') : 'Belum Input',
          'Sholat Dhuhur': dhuhur ? (dhuhur.status === 'sholat' ? 'Sholat' : 'Tidak') : 'Belum Input',
          'Sholat Ashar': ashar ? (ashar.status === 'sholat' ? 'Sholat' : 'Tidak') : 'Belum Input',
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Presensi');
    XLSX.writeFile(workbook, `Rekap_Presensi_Sholat_Global_${startDate}_to_${endDate}.xlsx`);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Calculate Statistics based on raw fetched attendance
  const totalRecords = attendance.length;
  const totalSholat = attendance.filter(a => a.status === 'sholat').length;
  const totalTidak = attendance.filter(a => a.status === 'tidak').length;
  const percentageSholat = totalRecords > 0 ? ((totalSholat / totalRecords) * 100).toFixed(1) : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Rekapitulasi Presensi Sholat Siswa
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Panel Koordinator Keagamaan untuk memantau presensi seluruh kelas secara real-time.
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

      {/* Filter Toolbar */}
      <div className="glass-card no-print" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
            {/* Filter Date Range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--text-secondary)" />
              <input
                type="date"
                className="form-input"
                style={{ width: '150px', padding: '8px 12px' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ color: 'var(--text-secondary)' }}>s.d.</span>
              <input
                type="date"
                className="form-input"
                style={{ width: '150px', padding: '8px 12px' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Filter Prayer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} color="var(--text-secondary)" />
              <select
                className="form-select"
                style={{ width: '150px', padding: '8px 12px' }}
                value={selectedPrayer}
                onChange={(e) => setSelectedPrayer(e.target.value)}
              >
                <option value="all">Semua Sholat</option>
                <option value="dhuha">Dhuha</option>
                <option value="dhuhur">Dhuhur</option>
                <option value="ashar">Ashar</option>
              </select>
            </div>

            {/* Filter Class */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                className="form-select"
                style={{ width: '160px', padding: '8px 12px' }}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="all">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', padding: '8px 12px 8px 38px' }}
              placeholder="Cari NIS / Nama Siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Rekap Table */}
      <div className="glass-card">
        {/* Printable Header Details */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            LAPORAN REKAPITULASI PRESENSI SHOLAT SISWA
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Periode: {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s.d. {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Kelas: {selectedClass === 'all' ? 'Semua Kelas' : classes.find(c => c.id === selectedClass)?.name || '-'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }} className="no-print">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Data Presensi Rekapitulasi
          </h3>
          <button onClick={fetchAttendance} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh Table
          </button>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '60px', whiteSpace: 'nowrap' }}>No</th>
                <th style={{ width: '140px', whiteSpace: 'nowrap' }}>NIS</th>
                <th style={{ whiteSpace: 'nowrap' }}>Nama Siswa</th>
                <th style={{ whiteSpace: 'nowrap' }}>Kelas</th>
                <th style={{ whiteSpace: 'nowrap' }}>Wali Kelas</th>
                <th style={{ width: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>Tanggal</th>
                <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Sholat Dhuha</th>
                <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Sholat Dhuhur</th>
                <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Sholat Ashar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Memuat data presensi...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    Tidak ada data presensi sholat untuk kriteria filter ini.
                  </td>
                </tr>
              ) : (
                (() => {
                  const dates = getDatesInRange(startDate, endDate);
                  let globalIdx = 0;

                  return filteredStudents.flatMap((student) => 
                    dates.map((date) => {
                      globalIdx++;
                      const dhuha = attendance.find(a => a.student_id === student.id && a.date === date && a.prayer_type === 'dhuha');
                      const dhuhur = attendance.find(a => a.student_id === student.id && a.date === date && a.prayer_type === 'dhuhur');
                      const ashar = attendance.find(a => a.student_id === student.id && a.date === date && a.prayer_type === 'ashar');

                      return (
                        <tr key={`${student.id}-${date}`}>
                          <td style={{ textAlign: 'center', color: '#64748b', whiteSpace: 'nowrap' }}>{globalIdx}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{student.nis}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{student.name}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{student.classes?.name || '-'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{classes.find(c => c.id === student.class_id)?.homeroom_teacher_name || '-'}</td>
                          <td style={{ textAlign: 'center', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                          
                          {/* Dhuha */}
                          <td style={{ textAlign: 'center' }}>
                            {dhuha ? (
                              dhuha.status === 'sholat' ? (
                                <CheckCircle size={18} style={{ color: '#10b981', display: 'inline-block' }} />
                              ) : (
                                <XCircle size={18} style={{ color: '#ef4444', display: 'inline-block' }} />
                              )
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>-</span>
                            )}
                          </td>

                          {/* Dhuhur */}
                          <td style={{ textAlign: 'center' }}>
                            {dhuhur ? (
                              dhuhur.status === 'sholat' ? (
                                <CheckCircle size={18} style={{ color: '#10b981', display: 'inline-block' }} />
                              ) : (
                                <XCircle size={18} style={{ color: '#ef4444', display: 'inline-block' }} />
                              )
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>-</span>
                            )}
                          </td>

                          {/* Ashar */}
                          <td style={{ textAlign: 'center' }}>
                            {ashar ? (
                              ashar.status === 'sholat' ? (
                                <CheckCircle size={18} style={{ color: '#10b981', display: 'inline-block' }} />
                              ) : (
                                <XCircle size={18} style={{ color: '#ef4444', display: 'inline-block' }} />
                              )
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
