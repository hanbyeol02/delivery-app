import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function init() {
  const client = await pool.connect();
  try {
    console.log('Creating tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS restaurants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        image_url TEXT,
        address VARCHAR(255),
        min_order INT DEFAULT 0,
        delivery_time VARCHAR(50) DEFAULT '30-40분'
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        restaurant_id INT REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        price INT NOT NULL,
        description TEXT,
        image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        restaurant_id INT REFERENCES restaurants(id),
        restaurant_name VARCHAR(255),
        total_price INT NOT NULL,
        status VARCHAR(50) DEFAULT '접수완료',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INT REFERENCES menu_items(id),
        name VARCHAR(255) NOT NULL,
        price INT NOT NULL,
        quantity INT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        restaurant_id INT REFERENCES restaurants(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        user_name VARCHAR(255) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 기존 테이블에 컬럼 추가 (없을 경우에만)
    await client.query(`
      ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address VARCHAR(255);
    `);

    console.log('Seeding restaurants...');

    await client.query(`DELETE FROM reviews; DELETE FROM order_items; DELETE FROM orders; DELETE FROM menu_items; DELETE FROM restaurants;`);

    const restaurants = [
      { name: '맛있는 치킨집', category: '치킨', description: '바삭바삭한 치킨 전문점', image_url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400', delivery_time: '25-35분', address: '서울시 마포구 홍대입구역 3번 출구 앞' },
      { name: '행복한 피자', category: '피자', description: '정통 이탈리안 피자', image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', delivery_time: '30-40분', address: '서울시 강남구 역삼동 테헤란로 123' },
      { name: '신선한 초밥', category: '일식', description: '신선한 재료로 만든 초밥', image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400', delivery_time: '40-50분', address: '서울시 송파구 잠실동 올림픽로 456' },
      { name: '불맛 삼겹살', category: '한식', description: '숯불 직화 삼겹살', image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400', delivery_time: '20-30분', address: '서울시 서대문구 신촌동 연세로 78' },
      { name: '달콤한 디저트', category: '디저트', description: '케이크와 음료 전문점', image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400', delivery_time: '15-25분', address: '서울시 용산구 이태원동 이태원로 99' },
    ];

    const menus = {
      '맛있는 치킨집': [
        { name: '후라이드 치킨', price: 18000, description: '바삭한 기본 후라이드' },
        { name: '양념 치킨', price: 19000, description: '달콤매콤 양념 치킨' },
        { name: '간장 치킨', price: 19000, description: '고소한 간장 치킨' },
        { name: '콜라 1.25L', price: 3000, description: '시원한 콜라' },
      ],
      '행복한 피자': [
        { name: '마르게리타', price: 22000, description: '토마토, 모차렐라, 바질' },
        { name: '페퍼로니', price: 24000, description: '페퍼로니가 가득' },
        { name: '하와이안', price: 23000, description: '파인애플과 햄' },
        { name: '감자튀김', price: 5000, description: '바삭한 감자튀김' },
      ],
      '신선한 초밥': [
        { name: '연어 초밥 (2P)', price: 8000, description: '신선한 연어' },
        { name: '참치 초밥 (2P)', price: 9000, description: '생참치' },
        { name: '새우 초밥 (2P)', price: 7000, description: '탱글한 새우' },
        { name: '모둠 초밥 (10P)', price: 28000, description: '셰프 추천 모둠' },
      ],
      '불맛 삼겹살': [
        { name: '삼겹살 200g', price: 15000, description: '국내산 삼겹살' },
        { name: '목살 200g', price: 14000, description: '부드러운 목살' },
        { name: '된장찌개', price: 5000, description: '구수한 된장찌개' },
        { name: '공기밥', price: 1000, description: '흰쌀밥' },
      ],
      '달콤한 디저트': [
        { name: '딸기 케이크', price: 7500, description: '생크림 딸기 케이크' },
        { name: '초코 브라우니', price: 5000, description: '진한 초콜릿 브라우니' },
        { name: '아메리카노', price: 3500, description: '에스프레소 아메리카노' },
        { name: '딸기 라떼', price: 5000, description: '달콤한 딸기 라떼' },
      ],
    };

    for (const r of restaurants) {
      const res = await client.query(
        `INSERT INTO restaurants (name, category, description, image_url, delivery_time, address) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [r.name, r.category, r.description, r.image_url, r.delivery_time, r.address]
      );
      const restaurantId = res.rows[0].id;
      for (const item of menus[r.name]) {
        await client.query(
          `INSERT INTO menu_items (restaurant_id, name, price, description) VALUES ($1,$2,$3,$4)`,
          [restaurantId, item.name, item.price, item.description]
        );
      }
    }

    console.log('✅ DB 초기화 완료!');
  } catch (err) {
    console.error('❌ 오류:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

init();
