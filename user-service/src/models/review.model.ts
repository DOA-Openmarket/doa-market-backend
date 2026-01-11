import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * Review 모델 - 상품 리뷰
 */
class Review extends Model {
  public id!: string;
  public userId!: string;
  public productId!: string;
  public orderId!: string;
  public rating!: number;
  public content!: string;
  public imageUrls?: string[];
  public helpfulCount!: number; // 도움이 돼요 카운트
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Review.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '상품 ID',
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '주문 ID',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
      comment: '별점 (1-5)',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '리뷰 내용',
    },
    imageUrls: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '리뷰 이미지 URL 배열',
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '도움이 돼요 카운트',
    },
  },
  {
    sequelize,
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['productId'] },
      { fields: ['orderId'] },
      { fields: ['rating'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default Review;
