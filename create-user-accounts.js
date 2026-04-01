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

// User accounts data
const userAccounts = [
  {
    userId: uuidv4(),
    email: 'test@example.com',
    password: 'Test1234!',
    name: '테스트 유저',
    phone: '010-1111-2222'
  },
  {
    userId: uuidv4(),
    email: 'demo@doa.com',
    password: 'demo123',
    name: '데모 유저',
    phone: '010-3333-4444'
  }
];

async function createUserAccount(userAccount) {
  // Check if email already exists
  const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [userAccount.email]);

  if (existingUser.rows.length > 0) {
    console.log(`⚠️  이미 존재하는 이메일입니다: ${userAccount.email}`);
    console.log('   기존 계정 정보:');
    console.log(`   - Email: ${existingUser.rows[0].email}`);
    console.log(`   - Name: ${existingUser.rows[0].name}`);
    console.log(`   - Role: ${existingUser.rows[0].role}`);
    console.log('');
    return false;
  }

  // Hash password
  console.log(`🔐 비밀번호 해싱 중... (${userAccount.email})`);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userAccount.password, salt);
  console.log('✅ 비밀번호 해싱 완료\n');

  // Create user (using 'id' as primary key to match auth-service model)
  console.log(`👤 사용자 계정 생성 중... (${userAccount.email})`);
  await db.query(
    `INSERT INTO users (id, email, password, name, phone, role, status, "emailVerified", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 'user', 'active', true, NOW(), NOW())`,
    [userAccount.userId, userAccount.email, hashedPassword, userAccount.name, userAccount.phone]
  );
  console.log(`✅ 사용자 생성 완료: ${userAccount.name} (${userAccount.email})\n`);

  return true;
}

async function createUserAccounts() {
  try {
    console.log('📦 데이터베이스 연결 중...');
    await db.connect();
    console.log('✅ 데이터베이스 연결 완료\n');

    const createdAccounts = [];

    for (const userAccount of userAccounts) {
      const created = await createUserAccount(userAccount);
      if (created) {
        createdAccounts.push(userAccount);
      }
    }

    // Success message
    if (createdAccounts.length > 0) {
      console.log('='.repeat(60));
      console.log('🎉 유저 계정 생성 완료!\n');

      for (const account of createdAccounts) {
        console.log('📋 계정 정보:');
        console.log(`   이메일: ${account.email}`);
        console.log(`   비밀번호: ${account.password}`);
        console.log(`   이름: ${account.name}`);
        console.log(`   전화번호: ${account.phone}`);
        console.log(`   역할: user`);
        console.log(`   상태: active (로그인 가능)`);
        console.log('');
      }

      console.log('📝 로그인 방법:');
      console.log('   1. 유저 앱 실행');
      console.log('   2. 위의 이메일과 비밀번호로 로그인');
      console.log('='.repeat(60));
    } else {
      console.log('\n⚠️  생성된 계정이 없습니다. 모든 계정이 이미 존재합니다.');
    }

  } catch (error) {
    console.error('❌ 에러 발생:', error);
    throw error;
  } finally {
    await db.end();
    console.log('\n✅ 데이터베이스 연결 종료');
  }
}

createUserAccounts()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
