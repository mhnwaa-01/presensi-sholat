import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    // Query user from Supabase
    console.log('[LOGIN API] Attempting login for username:', username);
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      console.log('[LOGIN API] User query failed. Error:', error, 'User:', user);
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    console.log('[LOGIN API] User found:', user.username, 'Hash in DB:', user.password_hash);

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    console.log('[LOGIN API] Password verification result:', isValid);
    if (!isValid) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    // Issue JWT token
    const token = await signToken({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      class_id: user.class_id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        class_id: user.class_id,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
