'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  restaurant_name: string;
  total_price: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setOrders(d.orders || []);
        setLoading(false);
      });
  }, []);

  const formatDate = (str: string) => {
    const d = new Date(str);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-800">← 뒤로</Link>
          <h1 className="text-lg font-bold text-gray-800">주문 내역</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">불러오는 중...</div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">{error}</p>
            <Link href="/login" className="bg-orange-500 text-white px-6 py-2 rounded-lg">로그인하기</Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🛍</p>
            <p className="text-gray-500 mb-4">아직 주문 내역이 없습니다</p>
            <Link href="/" className="bg-orange-500 text-white px-6 py-2 rounded-lg">음식 주문하기</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{order.restaurant_name}</h3>
                    <p className="text-gray-400 text-xs mt-1">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    order.status === '배달완료' ? 'bg-green-100 text-green-600' :
                    order.status === '배달중' ? 'bg-blue-100 text-blue-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {order.status === '접수완료' ? '🧾 접수완료' :
                     order.status === '배달중' ? '🛵 배달중' :
                     order.status === '배달완료' ? '✅ 배달완료' : order.status}
                  </span>
                </div>
                <div className="border-t pt-3 space-y-1">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name} × {item.quantity}</span>
                      <span className="text-gray-800">{(item.price * item.quantity).toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-500">총 결제금액</span>
                  <span className="font-bold text-orange-500">{order.total_price.toLocaleString()}원</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
