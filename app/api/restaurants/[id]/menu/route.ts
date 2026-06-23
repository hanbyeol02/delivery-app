import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const restaurantResult = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    if (restaurantResult.rows.length === 0) {
      return NextResponse.json({ error: '식당을 찾을 수 없습니다.' }, { status: 404 });
    }

    const menuResult = await pool.query(
      'SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY id',
      [id]
    );

    return NextResponse.json({
      restaurant: restaurantResult.rows[0],
      menu: menuResult.rows,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
