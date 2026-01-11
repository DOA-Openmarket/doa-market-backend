const express = require('express');
const { Client } = require('pg');

const app = express();
const PORT = 3003;

// PostgreSQL 연결 설정
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'doa_products',
});

// 헬스 체크 엔드포인트
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'product-service',
    database: client._connected ? 'connected' : 'disconnected'
  });
});

// 간단한 상품 목록 엔드포인트
app.get('/api/v1/products', async (req, res) => {
  try {
    const result = await client.query('SELECT current_database(), current_user, version()');
    res.json({
      success: true,
      message: 'Database connection successful!',
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'DOA Market - Product Service',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      products: '/api/v1/products'
    }
  });
});

// 서버 시작
async function start() {
  try {
    // 데이터베이스 연결
    await client.connect();
    console.log('✓ PostgreSQL 연결 성공');
    
    // HTTP 서버 시작
    app.listen(PORT, () => {
      console.log('');
      console.log('======================================');
      console.log(`✅ Product Service 실행 중!`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log('======================================');
      console.log('');
      console.log('📍 테스트 엔드포인트:');
      console.log(`   GET  http://localhost:${PORT}/`);
      console.log(`   GET  http://localhost:${PORT}/api/v1/health`);
      console.log(`   GET  http://localhost:${PORT}/api/v1/products`);
      console.log('');
      console.log('💡 테스트 명령어:');
      console.log(`   curl http://localhost:${PORT}/api/v1/health`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ 시작 실패:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM 신호 받음, 종료 중...');
  await client.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n종료 중...');
  await client.end();
  process.exit(0);
});

start();
