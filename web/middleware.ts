import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'presensi-sholat-super-secret-key-2026'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = payload.role as string;

      // Force logout and redirect to login if role is ketua_kelas
      if (role === 'ketua_kelas') {
        const response = NextResponse.redirect(new URL('/', req.url));
        response.cookies.delete('auth_token');
        return response;
      }

      // 1. Wali Kelas route protection
      if (pathname.startsWith('/dashboard/wali-kelas') && !['admin', 'wali_kelas'].includes(role)) {
        return NextResponse.redirect(new URL('/dashboard/koordinator', req.url));
      }

      // 2. Koordinator route protection
      if (pathname.startsWith('/dashboard/koordinator') && !['admin', 'koordinator'].includes(role)) {
        return NextResponse.redirect(new URL('/dashboard/wali-kelas', req.url));
      }

      // 3. Admin route protection
      if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
        if (role === 'koordinator') return NextResponse.redirect(new URL('/dashboard/koordinator', req.url));
        if (role === 'wali_kelas') return NextResponse.redirect(new URL('/dashboard/wali-kelas', req.url));
        return NextResponse.redirect(new URL('/', req.url));
      }

      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
