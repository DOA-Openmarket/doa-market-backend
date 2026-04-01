const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function resetDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // 1. 현재 관리자 계정 확인
    console.log('\n📋 Current admin users:');
    const admins = await client.query(
      "SELECT id, email, name, role FROM users WHERE role = 'admin'"
    );
    console.log(admins.rows);

    // 2. users 테이블 초기화 (관리자 제외)
    console.log('\n🗑️  Deleting all customer users...');
    const deleteCustomers = await client.query(
      "DELETE FROM users WHERE role = 'user' RETURNING email"
    );
    console.log(`   Deleted ${deleteCustomers.rowCount} customer users`);

    // 3. sellers 테이블 초기화
    console.log('\n🗑️  Deleting all sellers...');
    const deleteSellers = await client.query(
      "DELETE FROM sellers RETURNING email"
    );
    console.log(`   Deleted ${deleteSellers.rowCount} sellers`);

    // 4. seller role users 삭제
    console.log('\n🗑️  Deleting all seller users...');
    const deleteSellerUsers = await client.query(
      "DELETE FROM users WHERE role = 'seller' RETURNING email"
    );
    console.log(`   Deleted ${deleteSellerUsers.rowCount} seller users`);

    // 5. 관리자 계정 확인 및 생성
    const adminEmail = 'rgfood1';
    const adminCheck = await client.query(
      "SELECT id FROM users WHERE email = $1 AND role = 'admin'",
      [adminEmail]
    );

    if (adminCheck.rows.length === 0) {
      console.log('\n➕ Creating admin user...');
      const hashedPassword = await bcrypt.hash('dkfwlvnem1!', 10);
      await client.query(
        `INSERT INTO users (id, email, password, name, phone, role, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'admin', 'active', NOW(), NOW())`,
        [adminEmail, hashedPassword, '관리자', '01012345678']
      );
      console.log(`   ✅ Admin user created: ${adminEmail}`);
    } else {
      console.log(`\n✅ Admin user already exists: ${adminEmail}`);
    }

    // 6. 테스트 고객 유저 생성 (5명)
    console.log('\n➕ Creating test customer users...');
    const testCustomers = [
      { email: 'customer01@test.com', name: '김고객', phone: '01011111111' },
      { email: 'customer02@test.com', name: '이고객', phone: '01022222222' },
      { email: 'customer03@test.com', name: '박고객', phone: '01033333333' },
      { email: 'customer04@test.com', name: '최고객', phone: '01044444444' },
      { email: 'customer05@test.com', name: '정고객', phone: '01055555555' },
    ];

    const password = await bcrypt.hash('Test1234!', 10);
    for (const customer of testCustomers) {
      await client.query(
        `INSERT INTO users (id, email, password, name, phone, role, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'user', 'active', NOW(), NOW())`,
        [customer.email, password, customer.name, customer.phone]
      );
      console.log(`   ✅ Created customer: ${customer.email} (${customer.name})`);
    }

    // 7. 테스트 판매자 생성 (5명)
    console.log('\n➕ Creating test sellers...');
    const testSellers = [
      {
        email: 'seller01@test.com',
        name: '김판매',
        phone: '01066666666',
        businessName: '테스트마켓01',
        businessNumber: '1234567890',
        representativeName: '김대표',
        bank: '국민은행',
        accountNumber: '12345678901234',
        accountHolder: '김대표'
      },
      {
        email: 'seller02@test.com',
        name: '이판매',
        phone: '01077777777',
        businessName: '테스트마켓02',
        businessNumber: '2345678901',
        representativeName: '이대표',
        bank: '신한은행',
        accountNumber: '23456789012345',
        accountHolder: '이대표'
      },
      {
        email: 'seller03@test.com',
        name: '박판매',
        phone: '01088888888',
        businessName: '테스트마켓03',
        businessNumber: '3456789012',
        representativeName: '박대표',
        bank: 'NH농협',
        accountNumber: '34567890123456',
        accountHolder: '박대표'
      },
      {
        email: 'seller04@test.com',
        name: '최판매',
        phone: '01099999999',
        businessName: '테스트마켓04',
        businessNumber: '4567890123',
        representativeName: '최대표',
        bank: '우리은행',
        accountNumber: '45678901234567',
        accountHolder: '최대표'
      },
      {
        email: 'seller05@test.com',
        name: '정판매',
        phone: '01000000000',
        businessName: '테스트마켓05',
        businessNumber: '5678901234',
        representativeName: '정대표',
        bank: '하나은행',
        accountNumber: '56789012345678',
        accountHolder: '정대표'
      },
    ];

    for (const seller of testSellers) {
      // seller user 생성
      const userResult = await client.query(
        `INSERT INTO users (id, email, password, name, phone, role, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'seller', 'active', NOW(), NOW())
         RETURNING id`,
        [seller.email, password, seller.name, seller.phone]
      );
      const userId = userResult.rows[0].id;

      // seller 정보 생성
      await client.query(
        `INSERT INTO sellers (
          id, user_id, business_name, business_number, representative_name,
          business_address, email, phone, bank, account_number, account_holder,
          status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved', NOW(), NOW()
        )`,
        [
          userId,
          seller.businessName,
          seller.businessNumber,
          seller.representativeName,
          '서울시 강남구 테스트로 123',
          seller.email,
          seller.phone,
          seller.bank,
          seller.accountNumber,
          seller.accountHolder
        ]
      );
      console.log(`   ✅ Created seller: ${seller.email} (${seller.businessName})`);
    }

    // 8. 최종 결과 확인
    console.log('\n📊 Final Database Summary:');
    const adminCount = await client.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    const customerCount = await client.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
    const sellerUserCount = await client.query("SELECT COUNT(*) FROM users WHERE role = 'seller'");
    const sellerCount = await client.query("SELECT COUNT(*) FROM sellers");

    console.log(`   👨‍💼 Admin users: ${adminCount.rows[0].count}`);
    console.log(`   👥 Customer users: ${customerCount.rows[0].count}`);
    console.log(`   🏪 Seller users: ${sellerUserCount.rows[0].count}`);
    console.log(`   🏪 Sellers: ${sellerCount.rows[0].count}`);

    console.log('\n✅ Database reset completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin: rgfood1 / dkfwlvnem1!');
    console.log('   All test users: Test1234!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

resetDatabase();
