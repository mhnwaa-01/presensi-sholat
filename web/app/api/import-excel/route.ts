import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // 1. Verify Admin authentication
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak. Fitur ini khusus Admin.' }, { status: 403 });
    }

    // 2. Extract uploaded file and optional target classId
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetClassId = formData.get('classId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File Excel tidak ditemukan.' }, { status: 400 });
    }

    let defaultClassName = '';
    if (targetClassId) {
      const { data: cData } = await supabaseAdmin
        .from('classes')
        .select('name')
        .eq('id', targetClassId)
        .single();
      if (cData) {
        defaultClassName = cData.name;
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Read Workbook using SheetJS XLSX
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json({ error: 'File Excel tidak memiliki sheet.' }, { status: 400 });
    }

    // 4. Parse & Normalize Columns from sheets
    let classesCreatedCount = 0;
    let studentsProcessedCount = 0;

    const classNamesSet: Set<string> = new Set();
    const normalizedStudents: Array<{ nis: string; name: string; className: string }> = [];

    // Decide sheets to process:
    // If targetClassId is provided, we only process the first sheet (class-specific import).
    // Otherwise, we process all sheets (multi-sheet global import).
    const sheetsToProcess = targetClassId ? [workbook.SheetNames[0]] : workbook.SheetNames;

    for (const sheetName of sheetsToProcess) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
      if (!rawRows || rawRows.length === 0) continue;

      const currentClassName = targetClassId ? defaultClassName : sheetName.trim();

      for (const row of rawRows) {
        const keys = Object.keys(row);

        const nisKey = keys.find(k => ['nis', 'nomor induk', 'no_induk', 'id_siswa'].includes(k.toLowerCase().trim()));
        const nameKey = keys.find(k => ['nama', 'nama siswa', 'nama lengkap', 'student name'].includes(k.toLowerCase().trim()));
        const classKey = keys.find(k => ['kelas', 'nama kelas', 'class'].includes(k.toLowerCase().trim()));

        const nis = nisKey ? String(row[nisKey]).trim() : '';
        const name = nameKey ? String(row[nameKey]).trim() : '';
        let className = classKey ? String(row[classKey]).trim() : '';
        if (!className) {
          className = currentClassName;
        }

        if (nis && name && className) {
          normalizedStudents.push({ nis, name, className });
          classNamesSet.add(className);
        }
      }
    }

    if (normalizedStudents.length === 0) {
      return NextResponse.json({
        error: 'Tidak ada data siswa valid ditemukan. Pastikan memiliki kolom NIS dan Nama Siswa di sheet Excel.',
      }, { status: 400 });
    }

    // 5. Ensure Classes exist in Supabase
    for (const cName of Array.from(classNamesSet)) {
      const { data: existingClass } = await supabaseAdmin
        .from('classes')
        .select('id')
        .eq('name', cName)
        .maybeSingle();

      if (!existingClass) {
        await supabaseAdmin
          .from('classes')
          .insert([{ name: cName }]);
        classesCreatedCount++;
      }
    }

    // Fetch all current classes to map name -> id
    const { data: allClasses } = await supabaseAdmin.from('classes').select('id, name');
    const classIdMap = new Map((allClasses || []).map(c => [c.name, c.id]));

    // 6. Upsert Students into Supabase (insert new or update name if NIS already exists)
    for (const s of normalizedStudents) {
      const classId = classIdMap.get(s.className);
      if (classId) {
        await supabaseAdmin
          .from('students')
          .upsert({
            nis: s.nis,
            name: s.name,
            class_id: classId,
          }, { onConflict: 'nis' });
        studentsProcessedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses impor!`,
      details: {
        totalStudentsProcessed: studentsProcessedCount,
        newClassesCreated: classesCreatedCount,
        totalClassesFound: classNamesSet.size,
      },
    });
  } catch (error: any) {
    console.error('Import Excel Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses file Excel.' }, { status: 500 });
  }
}
