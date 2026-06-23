'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Restaurant {
  id: number;
  name: string;
  category: string;
  description: string;
  image_url: string;
  delivery_time: string;
}

interface User {
  id: number;
  email: string;
  name: string;
}

const CATEGORIES = ['전체', '치킨', '피자', '일식', '한식', '디저트'];

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user));
    fetch('/api/restaurants')
      .then(r => r.json())
      .then(d => { setRestaurants(d.restaurants || []); setLoading(false); });
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.refresh();
  };

  const filtered = selectedCategory === '전체'
    ? restaurants
    : restaurants.filter(r => r.category === selectedCategory);

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-500">🛵 띵동</h1>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-gray-600 text-sm">{user.name}님 🙌</span>
                <Link href="/orders" className="text-sm bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-2 rounded-lg font-medium">
                  주문내역
                </Link>
                <button onClick={logout} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">로그인</Link>
                <Link href="/register" className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-br from-orange-400 to-pink-400 text-white py-12 px-4 text-center">
        <p className="text-4xl mb-3">🍜</p>
        <h2 className="text-3xl font-bold mb-2">오늘 뭐 먹지? 🤔</h2>
        <p className="text-orange-100 text-sm">먹고 싶은 거 골라봐요, 금방 올게요!</p>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <h2 className="text-lg font-bold text-gray-700 mb-4">
          {selectedCategory === '전체' ? '🏪 전체 식당' : `✨ ${selectedCategory} 맛집`}
          <span className="text-sm font-normal text-gray-400 ml-2">{filtered.length}곳</span>
        </h2>

        {loading ? (
          <div className="text-center py-20 text-gray-400">맛집 불러오는 중... 🍳</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-3xl mb-2">😅</p>
            <p>해당 카테고리 식당이 없어요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((r) => (
              <Link key={r.id} href={`/restaurants/${r.id}`}>
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden border border-orange-50">
                  {r.image_url && (
                    <img src={r.image_url} alt={r.name} className="w-full h-44 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{r.name}</h3>
                        <p className="text-gray-500 text-sm mt-1">{r.description}</p>
                      </div>
                      <span className="bg-orange-100 text-orange-500 text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 font-medium">
                        {r.category}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-400">⏱ 배달 {r.delivery_time}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
