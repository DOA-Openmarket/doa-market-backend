const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Database connection for local/RDS
const db = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 'doamarket'
});

// Partner account data
const partnerAccount = {
  userId: uuidv4(),
  sellerId: uuidv4(),
  email: 'partner@test.com',
  password: 'partner123!',
  name: '테스트 파트너',
  phone: '010-1234-5678',
  storeName: '테스트 스토어',
  businessNumber: '123-45-67899'
};

async function createPartnerAccount() {
  try {
    console.log('📦 데이터베이스 연결 중...');
    await db.connect();
    console.log('✅ 데이터베이스 연결 완료\n');

    // Check if email already exists
    console.log('🔍 이메일 중복 확인 중...');
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [partnerAccount.email]);

    if (existingUser.rows.length > 0) {
      console.log('⚠️  이미 존재하는 이메일입니다.');
      console.log('   기존 계정 정보:');
      console.log(`   - Email: ${existingUser.rows[0].email}`);
      console.log(`   - Name: ${existingUser.rows[0].name || existingUser.rows[0].fullName}`);
      console.log(`   - Role: ${existingUser.rows[0].role}`);
      console.log('\n   계정을 계속 사용하시거나, 스크립트의 이메일을 변경해주세요.\n');
      return;
    }

    // Hash password
    console.log('🔐 비밀번호 해싱 중...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(partnerAccount.password, salt);
    console.log('✅ 비밀번호 해싱 완료\n');

    // Create user
    console.log('👤 사용자 계정 생성 중...');
    await db.query(
      `INSERT INTO users ("userId", email, password, name, phone, role, status, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'seller', 'active', true, NOW(), NOW())`,
      [partnerAccount.userId, partnerAccount.email, hashedPassword, partnerAccount.name, partnerAccount.phone]
    );
    console.log(`✅ 사용자 생성 완료: ${partnerAccount.name} (${partnerAccount.email})\n`);

    // Create seller
    console.log('🏪 판매자 정보 생성 중...');
    await db.query(
      `INSERT INTO sellers ("sellerId", "userId", "storeName", "businessNumber", status, "verifiedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'verified', NOW(), NOW(), NOW())`,
      [partnerAccount.sellerId, partnerAccount.userId, partnerAccount.storeName, partnerAccount.businessNumber]
    );
    console.log(`✅ 판매자 생성 완료: ${partnerAccount.storeName}\n`);

    // Success message
    console.log('='.repeat(60));
    console.log('🎉 Partner 계정 생성 완료!\n');
    console.log('📋 계정 정보:');
    console.log(`   이메일: ${partnerAccount.email}`);
    console.log(`   비밀번호: ${partnerAccount.password}`);
    console.log(`   이름: ${partnerAccount.name}`);
    console.log(`   전화번호: ${partnerAccount.phone}`);
    console.log(`   스토어명: ${partnerAccount.storeName}`);
    console.log(`   사업자번호: ${partnerAccount.businessNumber}`);
    console.log(`   상태: verified (로그인 가능)`);
    console.log('\n📝 로그인 방법:');
    console.log(`   1. openmarket-client 실행 (npm run dev)`);
    console.log(`   2. Partner 페이지로 이동`);
    console.log(`   3. Email: ${partnerAccount.email}`);
    console.log(`   4. Password: ${partnerAccount.password}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 에러 발생:', error);
    throw error;
  } finally {
    await db.end();
    console.log('\n✅ 데이터베이스 연결 종료');
  }
}

createPartnerAccount()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
