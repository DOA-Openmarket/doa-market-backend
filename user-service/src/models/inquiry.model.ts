import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * Inquiry 모델 - 1:1 문의
 */
class Inquiry extends Model {
  public id!: string;
  public userId!: string;
  public title!: string;
  public content!: string;
  public category!: 'order' | 'product' | 'delivery' | 'payment' | 'etc';
  public status!: 'pending' | 'answered';
  public imageUrls?: string[];
  public answer?: string;
  public answeredBy?: string; // 답변한 관리자 ID
  public answeredAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Inquiry.init(
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '문의 제목',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '문의 내용',
    },
    category: {
      type: DataTypes.ENUM('order', 'product', 'delivery', 'payment', 'etc'),
      allowNull: false,
      defaultValue: 'etc',
      comment: '문의 카테고리',
    },
    status: {
      type: DataTypes.ENUM('pending', 'answered'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '답변 상태',
    },
    imageUrls: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '첨부 이미지 URL 배열',
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '관리자 답변',
    },
    answeredBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '답변한 관리자 ID',
    },
    answeredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '답변 일시',
    },
  },
  {
    sequelize,
    tableName: 'inquiries',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default Inquiry;
