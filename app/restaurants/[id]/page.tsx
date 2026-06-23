'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
}

interface Restaurant {
  id: number;
  name: string;
  category: string;
  description: string;
  image_url: string;
  delivery_time: string;
  address: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Review {
  id: number;
  user_name: string;
  rating: number;
  content: string;
  created_at: string;
}

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [message, setMessage] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [reviewMsg, setReviewMsg] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadReviews = () => {
    fetch(`/api/restaurants/${params.id}/reviews`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []));
  };

  useEffect(() => {
    fetch(`/api/restaurants/${params.id}/menu`)
      .then(r => r.json())
      .then(d => {
        setRestaurant(d.restaurant);
        setMenu(d.menu || []);
        setLoading(false);
      });
    loadReviews();
  }, [params.id]);

  const submitReview = async () => {
    setSubmittingReview(true);
    setReviewMsg('');
    const res = await fetch(`/api/restaurants/${params.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewForm),
    });
    const data = await res.json();
    setSubmittingReview(false);
    if (!res.ok) {
      setReviewMsg(data.error);
    } else {
      setReviewMsg('✅ 리뷰가 등록됐어요!');
      setReviewForm({ rating: 5, content: '' });
      loadReviews();
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.id === id ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => c.id !== id);
    });
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOrder = async () => {
    if (cart.length === 0) return;
    setOrdering(true);

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurant?.id,
        restaurant_name: restaurant?.name,
        items: cart,
        total_price: totalPrice,
      }),
    });

    const data = await res.json();
    setOrdering(false);

    if (!res.ok) {
      if (res.status === 401) {
        router.push('/login');
      } else {
        setMessage(data.error || '주문 실패');
      }
    } else {
      setCart([]);
      setMessage('✅ 주문이 완료되었습니다!');
      setTimeout(() => router.push('/orders'), 1500);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>;
  if (!restaurant) return <div className="text-center py-20 text-gray-400">식당을 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-800">← 뒤로</Link>
          <h1 className="text-lg font-bold text-gray-800">{restaurant.name}</h1>
        </div>
      </header>

      {restaurant.image_url && (
        <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-48 object-cover" />
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">{restaurant.category}</span>
          <span className="text-gray-400 text-sm">⏱ {restaurant.delivery_time}</span>
        </div>
        <p className="text-gray-600 text-sm mb-2">{restaurant.description}</p>
        {restaurant.address && (
          <p className="text-gray-400 text-xs mb-6">📍 {restaurant.address}</p>
        )}

        <h2 className="text-lg font-bold text-gray-800 mb-4">🍽 메뉴</h2>
        <div className="space-y-3 mb-8">
          {menu.map(item => {
            const cartItem = cart.find(c => c.id === item.id);
            return (
              <div key={item.id} className="bg-white rounded-xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-medium text-gray-800">{item.name}</h3>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                  <p className="text-orange-500 font-bold mt-1">{item.price.toLocaleString()}원</p>
                </div>
                <div className="flex items-center gap-2">
                  {cartItem ? (
                    <>
                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-lg flex items-center justify-center">-</button>
                      <span className="w-6 text-center font-bold">{cartItem.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg flex items-center justify-center">+</button>
                    </>
                  ) : (
                    <button onClick={() => addToCart(item)} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600">담기</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {message && (
          <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 mb-4 text-center text-sm">
            {message}
          </div>
        )}

        {/* 리뷰 섹션 */}
        <div className="mb-24">
          <h2 className="text-lg font-bold text-gray-800 mb-4">💬 리뷰</h2>

          {/* 리뷰 작성 */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">리뷰 작성</p>
            <div className="flex gap-1 mb-2">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                  className={`text-2xl ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
              ))}
            </div>
            <textarea
              value={reviewForm.content}
              onChange={e => setReviewForm(f => ({ ...f, content: e.target.value }))}
              placeholder="음식 맛이 어땠나요? 솔직하게 남겨주세요 😊"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              rows={3}
            />
            {reviewMsg && <p className="text-sm mt-1 text-green-600">{reviewMsg}</p>}
            <button
              onClick={submitReview}
              disabled={submittingReview || !reviewForm.content}
              className="mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-40"
            >
              {submittingReview ? '등록 중...' : '리뷰 등록'}
            </button>
          </div>

          {/* 리뷰 목록 */}
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-800 text-sm">{r.user_name}</span>
                    <span className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{r.content}</p>
                  <p className="text-gray-300 text-xs mt-1">{new Date(r.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600 text-sm">장바구니 {totalCount}개</span>
                <span className="font-bold text-orange-500">{totalPrice.toLocaleString()}원</span>
              </div>
              <button
                onClick={handleOrder}
                disabled={ordering}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition"
              >
                {ordering ? '주문 중...' : `${totalPrice.toLocaleString()}원 주문하기`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
