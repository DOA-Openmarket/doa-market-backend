const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Database connection for RDS
const db = new Client({
  host: 'doa-market-rds.cluster-c3e8ci0mgsqi.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  user: 'doaadmin',
  password: 'DoaMarket2026yEwitROOFAhg',
  database: 'doamarket'
});

async function createPartnerAccount() {
  try {
    console.log('📦 데이터베이스 연결 중...');
    await db.connect();
    console.log('✅ 데이터베이스 연결 완료\n');

    const email = 'partner@test.com';
    const password = 'partner123!';
    const name = '테스트 파트너';
    const phone = '010-1234-5678';
    const storeName = '테스트 스토어';
    const businessNumber = '123-45-67899';

    // Check users table structure
    console.log('🔍 테이블 구조 확인 중...');
    const tableInfo = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('Users 테이블 컬럼:', tableInfo.rows.map(r => r.column_name).join(', '));

    // Check if email already exists
    console.log('\n🔍 이메일 중복 확인 중...');
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      console.log('⚠️  이미 존재하는 이메일입니다.');
      console.log('   기존 계정 정보:');
      console.log(`   - Email: ${existingUser.rows[0].email}`);
      console.log(`   - Role: ${existingUser.rows[0].role}`);
      console.log('\n✅ 로그인 정보:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      return;
    }

    // Hash password
    console.log('🔐 비밀번호 해싱 중...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('✅ 비밀번호 해싱 완료\n');

    const userId = uuidv4();
    const sellerId = uuidv4();

    // Create user
    console.log('👤 사용자 계정 생성 중...');
    await db.query(
      `INSERT INTO users (id, email, password, name, phone, role, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'seller', 'active', NOW(), NOW())`,
      [userId, email, hashedPassword, name, phone]
    );
    console.log(`✅ 사용자 생성 완료: ${name} (${email})\n`);

    // Check sellers table structure
    const sellersTableInfo = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sellers'
      ORDER BY ordinal_position
    `);
    console.log('Sellers 테이블 컬럼:', sellersTableInfo.rows.map(r => r.column_name).join(', '));

    // Create seller
    console.log('\n🏪 판매자 정보 생성 중...');
    await db.query(
      `INSERT INTO sellers (id, "userId", "storeName", "businessNumber", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'verified', NOW(), NOW())`,
      [sellerId, userId, storeName, businessNumber]
    );
    console.log(`✅ 판매자 생성 완료: ${storeName}\n`);

    // Success message
    console.log('='.repeat(60));
    console.log('🎉 Partner 계정 생성 완료!\n');
    console.log('📋 로그인 정보:');
    console.log(`   이메일: ${email}`);
    console.log(`   비밀번호: ${password}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await db.end();
    console.log('\n✅ 데이터베이스 연결 종료');
  }
}

createPartnerAccount()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
