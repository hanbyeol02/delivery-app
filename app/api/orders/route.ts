import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { restaurant_id, restaurant_name, items, total_price } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: '주문 항목이 없습니다.' }, { status: 400 });
    }

    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, restaurant_id, restaurant_name, total_price) VALUES ($1, $2, $3, $4) RETURNING id',
      [user.id, restaurant_id, restaurant_name, total_price]
    );

    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, menu_item_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5)',
        [orderId, item.id, item.name, item.price, item.quantity]
      );
    }

    return NextResponse.json({ orderId, message: '주문이 완료되었습니다.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [order.id]
        );
        return { ...order, items: itemsResult.rows };
      })
    );

    return NextResponse.json({ orders });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
