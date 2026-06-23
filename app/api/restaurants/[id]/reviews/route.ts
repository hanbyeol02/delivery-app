import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await pool.query(
    'SELECT * FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC',
    [id]
  );
  return NextResponse.json({ reviews: result.rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { id } = await params;
  const { rating, content } = await req.json();

  if (!rating || !content) {
    return NextResponse.json({ error: '별점과 내용을 입력해주세요.' }, { status: 400 });
  }

  const existing = await pool.query(
    'SELECT id FROM reviews WHERE restaurant_id = $1 AND user_id = $2',
    [id, user.id]
  );
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: '이미 리뷰를 작성하셨습니다.' }, { status: 400 });
  }

  await pool.query(
    'INSERT INTO reviews (restaurant_id, user_id, user_name, rating, content) VALUES ($1,$2,$3,$4,$5)',
    [id, user.id, user.name, rating, content]
  );

  return NextResponse.json({ message: '리뷰가 등록되었습니다.' });
}
