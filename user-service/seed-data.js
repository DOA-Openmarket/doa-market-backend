const { Client } = require('pg');

const client = new Client({
  host: 'doa-market-db.cvyvmftqk10q.ap-northeast-2.rds.amazonaws.com',
  user: 'doa_market_admin',
  password: 'DoaMarket2026yEwitROOFAhg',
  database: 'doa_market_db',
  port: 5432,
});

async function seedData() {
  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Add sample users
    console.log('\n=== Adding sample users ===');
    await client.query(`
      INSERT INTO users (id, email, name, phone, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'user1@example.com', '김철수', '010-1234-5678', NOW(), NOW()),
        (gen_random_uuid(), 'user2@example.com', '이영희', '010-2345-6789', NOW(), NOW()),
        (gen_random_uuid(), 'user3@example.com', '박민수', '010-3456-7890', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✓ Users added');

    // 2. Add sample sellers
    console.log('\n=== Adding sample sellers ===');
    const sellersResult = await client.query(`
      INSERT INTO sellers (id, email, password, business_name, representative_name, business_number, status, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'seller1@example.com', 'hashed_password', '스마트폰 마켓', '김판매', '123-45-67890', 'APPROVED', NOW(), NOW()),
        (gen_random_uuid(), 'seller2@example.com', 'hashed_password', '패션 스토어', '이의류', '234-56-78901', 'APPROVED', NOW(), NOW()),
        (gen_random_uuid(), 'seller3@example.com', 'hashed_password', '전자제품 몰', '박전자', '345-67-89012', 'APPROVED', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `);
    console.log('✓ Sellers added');

    // 3. Add sample banners
    console.log('\n=== Adding sample banners ===');
    await client.query(`
      INSERT INTO banners (id, title, image_url, link_url, owner_type, status, is_active, sort_order, created_at, updated_at)
      VALUES
        (gen_random_uuid(), '신년 특가 세일', 'https://picsum.photos/1920/600?random=1', '/products', 'ADVERTISER', 'ACTIVE', true, 1, NOW(), NOW()),
        (gen_random_uuid(), '봄 맞이 프로모션', 'https://picsum.photos/1920/600?random=2', '/products', 'ADVERTISER', 'ACTIVE', true, 2, NOW(), NOW()),
        (gen_random_uuid(), '판매자 배너1', 'https://picsum.photos/1200/400?random=3', '/seller/shop', 'PARTNER', 'ACTIVE', true, 1, NOW(), NOW()),
        (gen_random_uuid(), '판매자 배너2', 'https://picsum.photos/1200/400?random=4', '/seller/shop', 'PARTNER', 'ACTIVE', true, 2, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Banners added');

    // 4. Add sample coupons
    console.log('\n=== Adding sample coupons ===');
    await client.query(`
      INSERT INTO coupons (id, name, code, discount_type, discount_value, min_purchase_amount, max_discount_amount, issued_by, start_date, end_date, is_active, created_at, updated_at)
      VALUES
        (gen_random_uuid(), '신규회원 할인 쿠폰', 'WELCOME2024', 'PERCENTAGE', 10, 10000, 5000, 'ADMIN', NOW(), NOW() + INTERVAL '30 days', true, NOW(), NOW()),
        (gen_random_uuid(), '5000원 할인 쿠폰', 'SAVE5000', 'FIXED', 5000, 30000, NULL, 'ADMIN', NOW(), NOW() + INTERVAL '30 days', true, NOW(), NOW()),
        (gen_random_uuid(), '판매자 쿠폰', 'SELLER10', 'PERCENTAGE', 15, 20000, 10000, 'SELLER', NOW(), NOW() + INTERVAL '14 days', true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING;
    `);
    console.log('✓ Coupons added');

    // 5. Add sample guides
    console.log('\n=== Adding sample guides ===');
    await client.query(`
      INSERT INTO guides (id, type, title, content, is_active, view_count, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'CUSTOMER', '상품 주문 방법', '상품을 주문하는 방법에 대한 안내입니다. 1. 상품 검색 2. 장바구니 담기 3. 주문하기', true, 0, NOW(), NOW()),
        (gen_random_uuid(), 'CUSTOMER', '배송 조회 방법', '배송 상황을 조회하는 방법입니다. 마이페이지 > 주문내역에서 확인하실 수 있습니다.', true, 0, NOW(), NOW()),
        (gen_random_uuid(), 'PARTNER', '상품 등록 가이드', '판매자를 위한 상품 등록 가이드입니다. 상품 정보를 정확히 입력해주세요.', true, 0, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Guides added');

    // 6. Add sample notices
    console.log('\n=== Adding sample notices ===');
    await client.query(`
      INSERT INTO notices (id, type, title, content, is_pinned, view_count, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'CUSTOMER', '[공지] 설 연휴 배송 안내', '설 연휴 기간 배송이 지연될 수 있습니다.', true, 0, NOW(), NOW()),
        (gen_random_uuid(), 'CUSTOMER', '개인정보 처리방침 변경 안내', '개인정보 처리방침이 업데이트되었습니다.', false, 0, NOW(), NOW()),
        (gen_random_uuid(), 'PARTNER', '[판매자] 정산 일정 안내', '2월 정산은 3월 5일에 진행됩니다.', true, 0, NOW(), NOW()),
        (gen_random_uuid(), 'SELLER', '[판매자] 신규 기능 업데이트', '상품 대량 등록 기능이 추가되었습니다.', false, 0, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Notices added');

    // 7. Add sample error reports
    console.log('\n=== Adding sample error reports ===');
    const usersForReports = await client.query('SELECT id FROM users LIMIT 1');
    if (usersForReports.rows.length > 0) {
      const userId = usersForReports.rows[0].id;
      await client.query(`
        INSERT INTO error_reports (id, reporter_id, reporter_type, category, type, title, content, status, created_at, updated_at)
        VALUES
          (gen_random_uuid(), $1, 'USER', 'BUG', 'ERROR', '결제 오류', '결제 진행 중 오류가 발생했습니다.', 'PENDING', NOW(), NOW()),
          (gen_random_uuid(), $1, 'USER', 'IMPROVEMENT', 'SUGGESTION', '검색 기능 개선 제안', '검색 결과를 더 정확하게 표시해주세요.', 'IN_PROGRESS', NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `, [userId]);
      console.log('✓ Error reports added');
    }

    // 8. Add sample FAQ
    console.log('\n=== Adding sample FAQ ===');
    await client.query(`
      INSERT INTO faqs (id, type, title, content, sort_order, is_active, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'CUSTOMER', '배송은 얼마나 걸리나요?', '주문 후 평균 2-3일 소요됩니다.', 1, true, NOW(), NOW()),
        (gen_random_uuid(), 'CUSTOMER', '반품은 어떻게 하나요?', '상품 수령 후 7일 이내 반품 가능합니다.', 2, true, NOW(), NOW()),
        (gen_random_uuid(), 'PARTNER', '정산은 언제 이루어지나요?', '매월 5일 전월 매출에 대한 정산이 진행됩니다.', 1, true, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ FAQ added');

    console.log('\n=== Sample data seeding completed successfully! ===');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.end();
  }
}

seedData();
