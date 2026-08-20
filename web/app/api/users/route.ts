import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession, hashPassword } from '@/lib/auth';

// GET: Fetch all users
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, username, full_name, role, class_id, classes(name), created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users });
}

// POST: Create account (Ketua Kelas / Wali Kelas / Koordinator)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, password, full_name, role, class_id } = await request.json();

    if (!username || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Field username, password, nama, dan role wajib diisi.' }, { status: 400 });
    }

    // Validate that class doesn't already have this role (only for ketua_kelas and wali_kelas)
    if (role === 'ketua_kelas' || role === 'wali_kelas') {
      if (class_id) {
        const { data: existingUser, error: checkError } = await supabaseAdmin
          .from('users')
          .select('id, full_name')
          .eq('role', role)
          .eq('class_id', class_id)
          .maybeSingle();

        if (checkError) {
          return NextResponse.json({ error: checkError.message }, { status: 500 });
        }

        if (existingUser) {
          const roleLabel = role === 'ketua_kelas' ? 'Ketua Kelas' : 'Wali Kelas';
          return NextResponse.json({ 
            error: `Kelas tersebut sudah memiliki ${roleLabel} (${existingUser.full_name}).` 
          }, { status: 400 });
        }
      }
    }

    const password_hash = await hashPassword(password);

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([{
        username,
        password_hash,
        full_name,
        role,
        class_id: class_id || null,
      }])
      .select('id, username, full_name, role, class_id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Username sudah digunakan. Gunakan username lain.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove account
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID user wajib diberikan' }, { status: 400 });
  }

  // Prevent self-deletion
  if (id === session.id) {
    return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PUT: Update user account
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, username, password, full_name, role, class_id } = await request.json();

    if (!id || !username || !full_name || !role) {
      return NextResponse.json({ error: 'Field ID, username, nama, dan role wajib diisi.' }, { status: 400 });
    }

    // Validate that class doesn't already have this role (only for ketua_kelas and wali_kelas)
    if (role === 'ketua_kelas' || role === 'wali_kelas') {
      if (class_id) {
        const { data: existingUser, error: checkError } = await supabaseAdmin
          .from('users')
          .select('id, full_name')
          .eq('role', role)
          .eq('class_id', class_id)
          .neq('id', id)
          .maybeSingle();

        if (checkError) {
          return NextResponse.json({ error: checkError.message }, { status: 500 });
        }

        if (existingUser) {
          const roleLabel = role === 'ketua_kelas' ? 'Ketua Kelas' : 'Wali Kelas';
          return NextResponse.json({ 
            error: `Kelas tersebut sudah memiliki ${roleLabel} (${existingUser.full_name}).` 
          }, { status: 400 });
        }
      }
    }

    const updateData: any = {
      username,
      full_name,
      role,
      class_id: class_id || null,
    };

    if (password) {
      updateData.password_hash = await hashPassword(password);
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, full_name, role, class_id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Username sudah digunakan. Gunakan username lain.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
