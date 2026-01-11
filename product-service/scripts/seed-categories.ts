import { sequelize } from "../src/config/database";
import Category from "../src/models/category.model";

const categories = [
  {
    name: "전자제품",
    slug: "electronics",
    displayOrder: 1,
    isActive: true,
  },
  {
    name: "의류",
    slug: "clothing",
    displayOrder: 2,
    isActive: true,
  },
  {
    name: "식품",
    slug: "food",
    displayOrder: 3,
    isActive: true,
  },
  {
    name: "도서",
    slug: "books",
    displayOrder: 4,
    isActive: true,
  },
  {
    name: "스포츠",
    slug: "sports",
    displayOrder: 5,
    isActive: true,
  },
  {
    name: "뷰티",
    slug: "beauty",
    displayOrder: 6,
    isActive: true,
  },
  {
    name: "홈&리빙",
    slug: "home-living",
    displayOrder: 7,
    isActive: true,
  },
  {
    name: "기타",
    slug: "others",
    displayOrder: 8,
    isActive: true,
  },
];

async function seedCategories() {
  try {
    await sequelize.authenticate();
    console.log("데이터베이스 연결 성공");

    // 기존 카테고리 확인
    const existingCategories = await Category.findAll();
    if (existingCategories.length > 0) {
      console.log(
        `이미 ${existingCategories.length}개의 카테고리가 존재합니다.`
      );
      console.log(
        "기존 카테고리:",
        existingCategories.map((c) => c.name).join(", ")
      );
      return;
    }

    // 카테고리 생성
    console.log("카테고리 데이터 추가 중...");
    for (const categoryData of categories) {
      await Category.create(categoryData);
      console.log(`✓ ${categoryData.name} 추가됨`);
    }

    console.log(`\n총 ${categories.length}개의 카테고리가 추가되었습니다.`);
  } catch (error) {
    console.error("카테고리 시드 오류:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

seedCategories()
  .then(() => {
    console.log("카테고리 시드 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("카테고리 시드 실패:", error);
    process.exit(1);
  });
