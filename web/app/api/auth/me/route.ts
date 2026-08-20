import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: session
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
