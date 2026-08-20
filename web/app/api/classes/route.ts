import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

// GET: Fetch all classes with student counts
export async function GET() {
  const { data: classes, error } = await supabaseAdmin
    .from('classes')
    .select('*, students(count), users(id, full_name, role)')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format the classes to dynamically read Wali Kelas and Ketua Kelas from users table
  const formattedClasses = classes?.map((c: any) => {
    const homeroomTeacher = c.users?.find((u: any) => u.role === 'wali_kelas')?.full_name || 'Belum Ditentukan';
    const leader = c.users?.find((u: any) => u.role === 'ketua_kelas')?.full_name || 'Belum Ditentukan';
    
    return {
      id: c.id,
      name: c.name,
      created_at: c.created_at,
      students: c.students,
      homeroom_teacher_name: homeroomTeacher,
      leader_name: leader
    };
  }) || [];

  return NextResponse.json({ classes: formattedClasses });
}

// POST: Create a new class
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Nama kelas wajib diisi' }, { status: 400 });
    }

    const { data: newClass, error } = await supabaseAdmin
      .from('classes')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Nama kelas sudah digunakan.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, class: newClass });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update class information
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name } = await request.json();
    if (!id || !name) {
      return NextResponse.json({ error: 'ID dan nama kelas wajib diisi' }, { status: 400 });
    }

    const { data: updatedClass, error } = await supabaseAdmin
      .from('classes')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Nama kelas sudah digunakan.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, class: updatedClass });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove class
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID kelas wajib diberikan' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('classes').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
