const { Client } = require('pg');

// Single database connection for RDS
const db = new Client({
  host: process.env.DB_HOST || 'doa-market-rds.cluster-c3e8ci0mgsqi.ap-northeast-2.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'doaadmin',
  password: process.env.DB_PASSWORD || 'DoaMarket2026yEwitROOFAhg',
  database: process.env.DB_NAME || 'doamarket'
});

// Category IDs (to be created)
const categoryIds = {
  '전자제품': '11111111-1111-1111-1111-111111111111',
  '패션': '22222222-2222-2222-2222-222222222222',
  '식품': '33333333-3333-3333-3333-333333333333',
  '생활용품': '44444444-4444-4444-4444-444444444444',
  '스포츠': '55555555-5555-5555-5555-555555555555',
  '도서': '66666666-6666-6666-6666-666666666666'
};

const categories = [
  { id: categoryIds['전자제품'], name: '전자제품', slug: 'electronics' },
  { id: categoryIds['패션'], name: '패션/의류', slug: 'fashion' },
  { id: categoryIds['식품'], name: '식품', slug: 'food' },
  { id: categoryIds['생활용품'], name: '생활용품', slug: 'living' },
  { id: categoryIds['스포츠'], name: '스포츠/레저', slug: 'sports' },
  { id: categoryIds['도서'], name: '도서', slug: 'books' }
];

// Seller data
const sellersData = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    email: 'seller1@doamarket.com',
    name: '김테크',
    storeName: '테크월드',
    businessNumber: '123-45-67890'
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    userId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    email: 'seller2@doamarket.com',
    name: '이패션',
    storeName: '패션하우스',
    businessNumber: '234-56-78901'
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    userId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    email: 'seller3@doamarket.com',
    name: '박푸드',
    storeName: '신선마켓',
    businessNumber: '345-67-89012'
  },
  {
    id: '10101010-1010-1010-1010-101010101010',
    userId: '20202020-2020-2020-2020-202020202020',
    email: 'seller4@doamarket.com',
    name: '최생활',
    storeName: '라이프샵',
    businessNumber: '456-78-90123'
  },
  {
    id: '30303030-3030-3030-3030-303030303030',
    userId: '40404040-4040-4040-4040-404040404040',
    email: 'seller5@doamarket.com',
    name: '정스포츠',
    storeName: '스포츠존',
    businessNumber: '567-89-01234'
  }
];

// Products data (식품 위주 100+ products)
const productsData = [
  // === 식품 (70개) - 메인 카테고리 ===

  // 과일류 (12개)
  { name: '유기농 사과 1.5kg', price: 15000, stock: 200, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'apple,fruit' },
  { name: '유기농 바나나 1.2kg', price: 9500, stock: 180, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'banana,fruit' },
  { name: '제주 감귤 2kg', price: 18000, stock: 150, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'tangerine,fruit' },
  { name: '국산 딸기 500g', price: 12000, stock: 120, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'strawberry,fruit' },
  { name: '샤인머스캣 포도 1kg', price: 28000, stock: 80, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'grape,fruit' },
  { name: '성주 참외 2kg', price: 16000, stock: 100, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'melon,fruit' },
  { name: '애플망고 1kg', price: 22000, stock: 70, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'mango,fruit' },
  { name: '무농약 배 2kg', price: 20000, stock: 90, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'pear,fruit' },
  { name: '골드키위 10개', price: 15000, stock: 110, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'kiwi,fruit' },
  { name: '천혜향 2kg', price: 24000, stock: 85, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'orange,fruit' },
  { name: '블루베리 500g', price: 18000, stock: 95, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'blueberry,fruit' },
  { name: '국산 복숭아 2kg', price: 22000, stock: 75, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'peach,fruit' },

  // 채소류 (12개)
  { name: '샐러드 채소 믹스 500g', price: 7500, stock: 200, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'salad,vegetable' },
  { name: '방울토마토 1kg', price: 9500, stock: 180, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'tomato,vegetable' },
  { name: '유기농 브로콜리 500g', price: 5500, stock: 150, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'broccoli,vegetable' },
  { name: '무농약 시금치 300g', price: 4500, stock: 170, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'spinach,vegetable' },
  { name: '유기농 당근 1kg', price: 6000, stock: 160, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'carrot,vegetable' },
  { name: '신선한 양배추 1통', price: 4000, stock: 140, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'cabbage,vegetable' },
  { name: '무농약 감자 3kg', price: 12000, stock: 120, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'potato,vegetable' },
  { name: '국산 양파 3kg', price: 8500, stock: 130, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'onion,vegetable' },
  { name: '유기농 애호박 2개', price: 5000, stock: 100, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'zucchini,vegetable' },
  { name: '깻잎 100g', price: 3500, stock: 110, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'perilla,vegetable' },
  { name: '파프리카 3색 3개', price: 7000, stock: 120, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'paprika,vegetable' },
  { name: '청경채 300g', price: 4500, stock: 90, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'bok-choy,vegetable' },

  // 곡물/쌀/견과류 (10개)
  { name: '무농약 쌀 10kg', price: 48000, stock: 80, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'rice,grain' },
  { name: '현미 5kg', price: 28000, stock: 90, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'brown-rice,grain' },
  { name: '찹쌀 3kg', price: 18000, stock: 70, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'glutinous-rice' },
  { name: '흑미 1kg', price: 12000, stock: 85, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'black-rice' },
  { name: '혼합 견과류 500g', price: 25000, stock: 120, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'nuts,mixed' },
  { name: '생 아몬드 300g', price: 15000, stock: 100, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'almond,nut' },
  { name: '호두 500g', price: 18000, stock: 95, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'walnut,nut' },
  { name: '통밀가루 1kg', price: 7500, stock: 110, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'wheat-flour' },
  { name: '귀리 1kg', price: 9500, stock: 80, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'oat,grain' },
  { name: '퀴노아 500g', price: 14000, stock: 75, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'quinoa,grain' },

  // 육류/수산물/단백질 (8개)
  { name: '무항생제 계란 30구', price: 14000, stock: 100, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'egg,protein' },
  { name: '국내산 닭가슴살 1kg', price: 12000, stock: 80, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'chicken,meat' },
  { name: '냉동 고등어 5마리', price: 18000, stock: 70, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'mackerel,fish' },
  { name: '냉동 새우살 500g', price: 22000, stock: 65, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'shrimp,seafood' },
  { name: '국산 돼지고기 삼겹살 500g', price: 15000, stock: 60, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'pork,meat' },
  { name: '냉동 연어 필렛 300g', price: 16000, stock: 55, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'salmon,fish' },
  { name: '순두부 500g', price: 3500, stock: 150, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'tofu,protein' },
  { name: '국산 소고기 불고기용 300g', price: 25000, stock: 45, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'beef,meat' },

  // 조미료/소스/오일 (10개)
  { name: '엑스트라버진 올리브유 1L', price: 38000, stock: 90, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'olive-oil' },
  { name: '국산 참기름 500ml', price: 28000, stock: 85, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'sesame-oil' },
  { name: '국산 들기름 500ml', price: 32000, stock: 70, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'perilla-oil' },
  { name: '천연 간장 1L', price: 22000, stock: 100, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'soy-sauce' },
  { name: '국산 고춧가루 500g', price: 18000, stock: 110, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'red-pepper' },
  { name: '전통 된장 1kg', price: 15000, stock: 95, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'soybean-paste' },
  { name: '고추장 1kg', price: 16000, stock: 90, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'gochujang' },
  { name: '국산 야생화 꿀 700g', price: 42000, stock: 60, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'honey' },
  { name: '천연 식초 900ml', price: 12000, stock: 105, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'vinegar' },
  { name: '히말라야 핑크솔트 500g', price: 9500, stock: 120, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'salt' },

  // 유제품 (6개)
  { name: '유기농 우유 1L', price: 4500, stock: 150, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'milk,dairy' },
  { name: '그릭요거트 450g', price: 5500, stock: 120, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'yogurt,dairy' },
  { name: '모짜렐라 치즈 200g', price: 7500, stock: 100, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'cheese,dairy' },
  { name: '체다 슬라이스 치즈 300g', price: 8500, stock: 110, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'cheese,cheddar' },
  { name: '무염 버터 450g', price: 9500, stock: 95, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'butter,dairy' },
  { name: '크림치즈 200g', price: 6500, stock: 85, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'cream-cheese' },

  // 음료 (6개)
  { name: '유기농 커피원두 500g', price: 32000, stock: 80, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'coffee,beans' },
  { name: '제주 녹차 잎차 100g', price: 25000, stock: 70, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'green-tea' },
  { name: '유자차 1kg', price: 18000, stock: 90, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'citron-tea' },
  { name: '생수 2L 12병', price: 12000, stock: 200, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'water,bottle' },
  { name: '콤부차 500ml', price: 8500, stock: 85, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'kombucha' },
  { name: '오렌지 주스 1L', price: 6500, stock: 100, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'orange-juice' },

  // 간식/과자 (6개)
  { name: '국산 김 20봉', price: 22000, stock: 120, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'seaweed,snack' },
  { name: '말린 과일 믹스 300g', price: 15000, stock: 95, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'dried-fruit' },
  { name: '통곡물 에너지바 10개', price: 18000, stock: 110, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'energy-bar' },
  { name: '프로틴 쉐이크 파우더 1kg', price: 45000, stock: 60, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'protein,powder' },
  { name: '다크초콜릿 70% 200g', price: 12000, stock: 100, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'chocolate,dark' },
  { name: '통밀 크래커 300g', price: 8500, stock: 90, categoryId: categoryIds['식품'], sellerId: sellersData[2].id, image: 'cracker,snack' },

  // === 전자제품 (8개) ===
  { name: '무선 이어폰 프리미엄', price: 89000, stock: 50, categoryId: categoryIds['전자제품'], sellerId: sellersData[0].id, image: 'earbuds,wireless' },
  { name: '블루투스 스피커', price: 125000, stock: 30, categoryId: categoryIds['전자제품'], sellerId: sellersData[0].id, image: 'speaker,bluetooth' },
  { name: 'USB 고속충전기 65W', price: 45000, stock: 100, categoryId: categoryIds['전자제품'], sellerId: sellersData[0].id, image: 'charger,usb' },
  { name: '노트북 거치대 알루미늄', price: 55000, stock: 40, categoryId: categoryIds['전자제품'], sellerId: sellersData[0].id, image: 'laptop-stand' },
  { name: 'HDMI 케이블 3M 4K', price: 25000, stock: 80, categoryId: categoryIds['전자제품'], sellerId: sellersData[0].id, image: 'cable,hdmi' },
  { name: '무선마우스 게이밍', price: 65000, stock: 60, categoryId: categoryIds['전자제품'], sellerId: sellersData[0].id, image: 'mouse,gaming' },
  { name: '기계식 키보드 RGB', price: 120000, stock: 35, categoryId: categoryIds['전자제품'], sellerId: sellersData[0].id, image: 'keyboard,mechanical' },
  { name: '휴대용 보조배터리 20000mAh', price: 48000, stock: 90, categoryId: categoryIds['전자제품'], sellerId: sellersData[0].id, image: 'powerbank' },

  // === 패션 (8개) ===
  { name: '면 티셔츠 화이트', price: 29000, stock: 150, categoryId: categoryIds['패션'], sellerId: sellersData[1].id, image: 'tshirt,white' },
  { name: '청바지 슬림핏', price: 79000, stock: 60, categoryId: categoryIds['패션'], sellerId: sellersData[1].id, image: 'jeans,slim' },
  { name: '운동화 캐주얼', price: 95000, stock: 45, categoryId: categoryIds['패션'], sellerId: sellersData[1].id, image: 'sneakers,casual' },
  { name: '크로스백 가죽', price: 85000, stock: 35, categoryId: categoryIds['패션'], sellerId: sellersData[1].id, image: 'bag,leather' },
  { name: '후드 집업 오버핏', price: 68000, stock: 55, categoryId: categoryIds['패션'], sellerId: sellersData[1].id, image: 'hoodie,zip' },
  { name: '니트 스웨터 울', price: 89000, stock: 40, categoryId: categoryIds['패션'], sellerId: sellersData[1].id, image: 'sweater,wool' },
  { name: '양말 세트 10켤레', price: 25000, stock: 100, categoryId: categoryIds['패션'], sellerId: sellersData[1].id, image: 'socks,set' },
  { name: '선글라스 UV차단', price: 55000, stock: 50, categoryId: categoryIds['패션'], sellerId: sellersData[1].id, image: 'sunglasses,uv' },

  // === 생활용품 (8개) ===
  { name: '물티슈 대용량 10팩', price: 18000, stock: 120, categoryId: categoryIds['생활용품'], sellerId: sellersData[3].id, image: 'wet-tissue' },
  { name: '화장지 30롤 3겹', price: 25000, stock: 90, categoryId: categoryIds['생활용품'], sellerId: sellersData[3].id, image: 'toilet-paper' },
  { name: '주방세제 대용량 2L', price: 12000, stock: 150, categoryId: categoryIds['생활용품'], sellerId: sellersData[3].id, image: 'dish-soap' },
  { name: '세탁세제 액체형 3L', price: 18000, stock: 95, categoryId: categoryIds['생활용품'], sellerId: sellersData[3].id, image: 'detergent,liquid' },
  { name: '칫솔 세트 12개입', price: 15000, stock: 200, categoryId: categoryIds['생활용품'], sellerId: sellersData[3].id, image: 'toothbrush,set' },
  { name: '샴푸 대용량 1.5L', price: 25000, stock: 75, categoryId: categoryIds['생활용품'], sellerId: sellersData[3].id, image: 'shampoo,bottle' },
  { name: '치약 세트 6개', price: 18000, stock: 100, categoryId: categoryIds['생활용품'], sellerId: sellersData[3].id, image: 'toothpaste,set' },
  { name: '방향제 겔타입 5개', price: 15000, stock: 85, categoryId: categoryIds['생활용품'], sellerId: sellersData[3].id, image: 'air-freshener' },

  // === 스포츠 (6개) ===
  { name: '요가매트 TPE 6mm', price: 42000, stock: 60, categoryId: categoryIds['스포츠'], sellerId: sellersData[4].id, image: 'yoga-mat' },
  { name: '덤벨 세트 10kg x 2', price: 75000, stock: 40, categoryId: categoryIds['스포츠'], sellerId: sellersData[4].id, image: 'dumbbell,fitness' },
  { name: '줄넘기 디지털 카운터', price: 22000, stock: 80, categoryId: categoryIds['스포츠'], sellerId: sellersData[4].id, image: 'jump-rope' },
  { name: '기능성 운동복 세트', price: 95000, stock: 35, categoryId: categoryIds['스포츠'], sellerId: sellersData[4].id, image: 'sportswear,fitness' },
  { name: '런닝화 에어 쿠션', price: 125000, stock: 45, categoryId: categoryIds['스포츠'], sellerId: sellersData[4].id, image: 'running-shoes' },
  { name: '운동 물통 1L BPA Free', price: 18000, stock: 70, categoryId: categoryIds['스포츠'], sellerId: sellersData[4].id, image: 'water-bottle,sport' },

  // === 도서 (6개) ===
  { name: '백종원의 집밥 레시피', price: 28000, stock: 45, categoryId: categoryIds['도서'], sellerId: sellersData[4].id, image: 'cookbook,recipe' },
  { name: '건강 다이어트 식단', price: 22000, stock: 50, categoryId: categoryIds['도서'], sellerId: sellersData[0].id, image: 'diet,book' },
  { name: '채식 요리책', price: 24000, stock: 40, categoryId: categoryIds['도서'], sellerId: sellersData[1].id, image: 'vegetarian,cookbook' },
  { name: '아침 30분 기적의 습관', price: 15500, stock: 60, categoryId: categoryIds['도서'], sellerId: sellersData[3].id, image: 'self-help,book' },
  { name: '사피엔스', price: 22000, stock: 55, categoryId: categoryIds['도서'], sellerId: sellersData[1].id, image: 'history,book' },
  { name: '돈의 속성', price: 17500, stock: 60, categoryId: categoryIds['도서'], sellerId: sellersData[4].id, image: 'finance,book' }
];

// Notices data
const noticesData = [
  {
    title: 'DOA 마켓 그랜드 오픈 이벤트',
    content: '신규 회원가입 시 5,000원 적립금 지급! 첫 구매 시 추가 10% 할인 쿠폰도 드립니다.',
    type: 'event',
    isPinned: true
  },
  {
    title: '2월 한정 무료배송 이벤트',
    content: '2월 한 달간 전 상품 무료배송! 이 기회를 놓치지 마세요.',
    type: 'event',
    isPinned: true
  },
  {
    title: '배송 안내',
    content: '평일 오후 2시 이전 주문 시 당일 출고됩니다. 주말 및 공휴일에는 배송이 지연될 수 있습니다.',
    type: 'notice',
    isPinned: false
  },
  {
    title: '개인정보처리방침 업데이트',
    content: '2026년 2월 1일부로 개인정보처리방침이 업데이트 되었습니다.',
    type: 'notice',
    isPinned: false
  },
  {
    title: '설 연휴 배송 안내',
    content: '설 연휴 기간 (2/8~2/11) 동안 배송이 일시 중단됩니다.',
    type: 'notice',
    isPinned: false
  },
  {
    title: '고객센터 운영시간 안내',
    content: '평일 09:00 ~ 18:00 (점심시간 12:00~13:00) / 주말 및 공휴일 휴무',
    type: 'notice',
    isPinned: false
  }
];

// Review templates for generating realistic reviews
const reviewTemplates = [
  { rating: 5, content: '정말 만족스러운 상품입니다. 품질도 좋고 배송도 빨라요!' },
  { rating: 5, content: '가격 대비 훌륭합니다. 재구매 의사 있어요.' },
  { rating: 4, content: '전반적으로 만족합니다. 다만 배송이 조금 늦었어요.' },
  { rating: 5, content: '기대 이상이에요. 강력 추천합니다!' },
  { rating: 4, content: '좋은 상품입니다. 다음에 또 구매할게요.' },
  { rating: 5, content: '포장도 깔끔하고 상품도 완벽해요!' },
  { rating: 5, content: '가족들도 모두 만족해합니다. 감사합니다.' },
  { rating: 4, content: '생각했던 것보다 더 좋네요. 만족합니다.' },
  { rating: 5, content: '품질 최고입니다. 다른 분들께도 추천하고 싶어요.' },
  { rating: 4, content: '가격이 합리적이고 품질도 좋습니다.' }
];

async function seedAllData() {
  try {
    console.log('📦 데이터베이스 연결 중...');
    await db.connect();
    console.log('✅ 데이터베이스 연결 완료\n');

    // Step 0: Create categories
    console.log('📂 Step 0: 카테고리 생성 중...');
    const existingCategories = await db.query('SELECT COUNT(*) FROM categories');
    if (parseInt(existingCategories.rows[0].count) === 0) {
      for (const category of categories) {
        await db.query(
          `INSERT INTO categories ("categoryId", name, slug, "parentId", "displayOrder", "isActive", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NULL, 0, true, NOW(), NOW())`,
          [category.id, category.name, category.slug]
        );
        console.log(`  ✓ ${category.name}`);
      }
      console.log(`✅ ${categories.length}개의 카테고리 생성 완료\n`);
    } else {
      console.log(`  ⚠️  이미 ${existingCategories.rows[0].count}개의 카테고리가 존재합니다.\n`);
    }

    // Step 1: Create users
    console.log('👥 Step 1: 사용자 계정 생성 중...');
    for (const seller of sellersData) {
      await db.query(
        `INSERT INTO users (id, email, name, phone, role, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 'user', 'active', NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        [seller.userId, seller.email, seller.name, '010-1234-5678']
      );
      console.log(`  ✓ ${seller.name} (${seller.email})`);
    }
    console.log(`✅ ${sellersData.length}명의 사용자 생성 완료\n`);

    // Step 2: Create sellers
    console.log('🏪 Step 2: 판매자 정보 생성 중...');
    for (const seller of sellersData) {
      await db.query(
        `INSERT INTO sellers (id, "userId", "storeName", "businessNumber", status, "verifiedAt", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 'verified', NOW(), NOW(), NOW())
         ON CONFLICT ("businessNumber") DO NOTHING`,
        [seller.id, seller.userId, seller.storeName, seller.businessNumber]
      );
      console.log(`  ✓ ${seller.storeName} (사업자번호: ${seller.businessNumber})`);
    }
    console.log(`✅ ${sellersData.length}개의 판매자 생성 완료\n`);

    // Step 3: Create products
    console.log('📦 Step 3: 상품 데이터 생성 중...');
    let productIndex = 1;
    for (const product of productsData) {
      const productId = `${productIndex.toString().padStart(8, '0')}-0000-0000-0000-000000000000`;

      // 실제 이미지 URL 생성 (Unsplash Source 사용)
      const imageKeyword = product.image || 'product';
      const thumbnail = `https://source.unsplash.com/400x400/?${imageKeyword}`;

      const description = `고품질 ${product.name}입니다. 믿을 수 있는 판매자가 제공하는 검증된 상품으로 안심하고 구매하세요. 빠른 배송과 우수한 품질을 보장합니다.`;
      const slug = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '') + '-' + productIndex;

      await db.query(
        `INSERT INTO products (id, name, slug, description, price, thumbnail, "stockQuantity", "sellerId", "categoryId", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [productId, product.name, slug, description, product.price, thumbnail, product.stock, product.sellerId, product.categoryId]
      );
      console.log(`  ✓ [${productIndex}] ${product.name} - ${product.price.toLocaleString()}원`);
      productIndex++;
    }
    console.log(`✅ ${productsData.length}개의 상품 생성 완료\n`);

    // Step 4: Create notices
    console.log('📢 Step 4: 공지사항 생성 중...');
    for (const notice of noticesData) {
      await db.query(
        `INSERT INTO notices (title, content, type, "isPinned", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 'published', NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [notice.title, notice.content, notice.type, notice.isPinned]
      );
      console.log(`  ✓ ${notice.title}`);
    }
    console.log(`✅ ${noticesData.length}개의 공지사항 생성 완료\n`);

    // Step 5: Create sample reviews (스킵 - orderId 필요)
    console.log('⭐ Step 5: 리뷰 데이터 생성 스킵 (주문 데이터 필요)\n');
    const reviewCount = 0;

    // Summary
    console.log('='.repeat(60));
    console.log('🎉 모든 시드 데이터 생성 완료!\n');
    console.log('📊 생성된 데이터 요약:');
    console.log(`  - 카테고리: ${categories.length}개`);
    console.log(`  - 사용자: ${sellersData.length + 5}명 (판매자 ${sellersData.length} + 리뷰어 5)`);
    console.log(`  - 판매자: ${sellersData.length}개`);
    console.log(`  - 상품: ${productsData.length}개`);
    console.log(`  - 리뷰: ${reviewCount}개`);
    console.log(`  - 공지사항: ${noticesData.length}개`);
    console.log('='.repeat(60));
    console.log('\n💡 팁: 앱에서 카테고리별로 다양한 상품을 확인할 수 있습니다.');
    console.log('💡 실제 이미지는 Unsplash API를 통해 자동으로 표시됩니다.\n');

  } catch (error) {
    console.error('❌ 에러 발생:', error);
    throw error;
  } finally {
    await db.end();
    console.log('\n✅ 데이터베이스 연결 종료');
  }
}

seedAllData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
