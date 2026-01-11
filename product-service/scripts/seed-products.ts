import { sequelize } from "../src/config/database";
import Category from "../src/models/category.model";
import Product from "../src/models/product.model";

// 기본 seller ID (실제로는 인증된 seller ID를 사용해야 함)
const DEFAULT_SELLER_ID = "00000000-0000-0000-0000-000000000001";

const products = [
  // 전자제품
  {
    name: "스마트폰 갤럭시 S24",
    slug: "galaxy-s24",
    description: "최신 갤럭시 스마트폰, 256GB 저장공간",
    price: 1200000,
    originalPrice: 1500000,
    status: "active",
    stockQuantity: 50,
    categorySlug: "electronics",
  },
  {
    name: "아이폰 15 Pro",
    slug: "iphone-15-pro",
    description: "애플 최신 스마트폰, 프로 모델",
    price: 1500000,
    originalPrice: 1800000,
    status: "active",
    stockQuantity: 30,
    categorySlug: "electronics",
  },
  {
    name: "노트북 맥북 프로",
    slug: "macbook-pro",
    description: "애플 맥북 프로 14인치, M3 칩",
    price: 2500000,
    originalPrice: 2800000,
    status: "active",
    stockQuantity: 20,
    categorySlug: "electronics",
  },
  {
    name: "무선 이어폰 에어팟 프로",
    slug: "airpods-pro",
    description: "애플 에어팟 프로 2세대",
    price: 350000,
    originalPrice: 400000,
    status: "active",
    stockQuantity: 100,
    categorySlug: "electronics",
  },
  // 의류
  {
    name: "면 티셔츠",
    slug: "cotton-tshirt",
    description: "편안한 면 소재의 기본 티셔츠",
    price: 25000,
    originalPrice: 35000,
    status: "active",
    stockQuantity: 200,
    categorySlug: "clothing",
  },
  {
    name: "청바지",
    slug: "jeans",
    description: "클래식한 스타일의 청바지",
    price: 89000,
    originalPrice: 120000,
    status: "active",
    stockQuantity: 150,
    categorySlug: "clothing",
  },
  {
    name: "후드집업",
    slug: "hoodie",
    description: "따뜻한 후드집업",
    price: 65000,
    originalPrice: 85000,
    status: "active",
    stockQuantity: 80,
    categorySlug: "clothing",
  },
  // 식품
  {
    name: "유기농 쌀 10kg",
    slug: "organic-rice",
    description: "국내산 유기농 쌀",
    price: 45000,
    originalPrice: 50000,
    status: "active",
    stockQuantity: 500,
    categorySlug: "food",
  },
  {
    name: "한우 등심 500g",
    slug: "hanwoo-ribeye",
    description: "프리미엄 한우 등심",
    price: 85000,
    originalPrice: 100000,
    status: "active",
    stockQuantity: 50,
    categorySlug: "food",
  },
  {
    name: "생수 2L 24병",
    slug: "water-2l-24",
    description: "천연 암반수",
    price: 12000,
    originalPrice: 15000,
    status: "active",
    stockQuantity: 1000,
    categorySlug: "food",
  },
  // 도서
  {
    name: "클린 코드",
    slug: "clean-code",
    description: "로버트 C. 마틴의 클린 코드",
    price: 28000,
    originalPrice: 32000,
    status: "active",
    stockQuantity: 100,
    categorySlug: "books",
  },
  {
    name: "리팩토링",
    slug: "refactoring",
    description: "마틴 파울러의 리팩토링 2판",
    price: 32000,
    originalPrice: 36000,
    status: "active",
    stockQuantity: 80,
    categorySlug: "books",
  },
  {
    name: "도메인 주도 설계",
    slug: "ddd",
    description: "에릭 에반스의 도메인 주도 설계",
    price: 35000,
    originalPrice: 40000,
    status: "active",
    stockQuantity: 60,
    categorySlug: "books",
  },
  // 스포츠
  {
    name: "운동화 나이키",
    slug: "nike-shoes",
    description: "나이키 에어맥스 운동화",
    price: 150000,
    originalPrice: 180000,
    status: "active",
    stockQuantity: 120,
    categorySlug: "sports",
  },
  {
    name: "요가 매트",
    slug: "yoga-mat",
    description: "프리미엄 요가 매트",
    price: 35000,
    originalPrice: 45000,
    status: "active",
    stockQuantity: 200,
    categorySlug: "sports",
  },
  {
    name: "덤벨 세트",
    slug: "dumbbell-set",
    description: "가정용 덤벨 세트 5kg x 2",
    price: 85000,
    originalPrice: 100000,
    status: "active",
    stockQuantity: 50,
    categorySlug: "sports",
  },
  // 뷰티
  {
    name: "스킨케어 세트",
    slug: "skincare-set",
    description: "프리미엄 스킨케어 3종 세트",
    price: 120000,
    originalPrice: 150000,
    status: "active",
    stockQuantity: 80,
    categorySlug: "beauty",
  },
  {
    name: "립스틱",
    slug: "lipstick",
    description: "장지속 립스틱",
    price: 25000,
    originalPrice: 30000,
    status: "active",
    stockQuantity: 300,
    categorySlug: "beauty",
  },
  // 홈&리빙
  {
    name: "에어프라이어",
    slug: "air-fryer",
    description: "대용량 에어프라이어",
    price: 180000,
    originalPrice: 220000,
    status: "active",
    stockQuantity: 60,
    categorySlug: "home-living",
  },
  {
    name: "무선 청소기",
    slug: "cordless-vacuum",
    description: "강력한 흡입력의 무선 청소기",
    price: 350000,
    originalPrice: 400000,
    status: "active",
    stockQuantity: 40,
    categorySlug: "home-living",
  },
  {
    name: "침구 세트",
    slug: "bedding-set",
    description: "고급 침구 세트",
    price: 120000,
    originalPrice: 150000,
    status: "active",
    stockQuantity: 100,
    categorySlug: "home-living",
  },
];

async function seedProducts() {
  try {
    await sequelize.authenticate();
    console.log("데이터베이스 연결 성공");

    // 기존 상품 확인
    const existingProducts = await Product.findAll();
    if (existingProducts.length > 0) {
      console.log(
        `이미 ${existingProducts.length}개의 상품이 존재합니다.`
      );
      console.log(
        "기존 상품:",
        existingProducts.map((p) => p.name).join(", ")
      );
      return;
    }

    // 카테고리 조회
    const categories = await Category.findAll();
    if (categories.length === 0) {
      console.error("카테고리가 없습니다. 먼저 카테고리를 추가해주세요.");
      return;
    }

    // 카테고리 맵 생성 (slug -> categoryId)
    const categoryMap = new Map<string, string>();
    categories.forEach((cat) => {
      categoryMap.set(cat.slug, cat.categoryId);
    });

    // 상품 생성
    console.log("상품 데이터 추가 중...");
    let successCount = 0;
    let failCount = 0;

    for (const productData of products) {
      const categoryId = categoryMap.get(productData.categorySlug);
      if (!categoryId) {
        console.error(
          `카테고리를 찾을 수 없습니다: ${productData.categorySlug}`
        );
        failCount++;
        continue;
      }

      try {
        await Product.create({
          sellerId: DEFAULT_SELLER_ID,
          categoryId: categoryId,
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          price: productData.price,
          originalPrice: productData.originalPrice,
          status: productData.status,
          stockQuantity: productData.stockQuantity,
        });
        console.log(`✓ ${productData.name} 추가됨`);
        successCount++;
      } catch (error: any) {
        console.error(`✗ ${productData.name} 추가 실패:`, error.message);
        failCount++;
      }
    }

    console.log(
      `\n총 ${successCount}개의 상품이 추가되었습니다. (실패: ${failCount})`
    );
  } catch (error) {
    console.error("상품 시드 오류:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

seedProducts()
  .then(() => {
    console.log("상품 시드 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("상품 시드 실패:", error);
    process.exit(1);
  });

