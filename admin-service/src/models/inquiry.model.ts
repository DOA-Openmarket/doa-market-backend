import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Inquiry extends Model {
  public id!: string;
  public userId!: string;
  public category!: string;
  public title!: string;
  public content!: string;
  public status!: string;
  public priority!: string;
  public answer?: string;
  public answeredBy?: string;
  public answeredAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Inquiry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '문의한 사용자 ID'
    },
    category: {
      type: DataTypes.ENUM('일반문의', '상품문의', '주문/배송', '결제', '환불/취소', '기타'),
      defaultValue: '일반문의',
      comment: '문의 카테고리'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '문의 제목'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '문의 내용'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'answered', 'closed'),
      defaultValue: 'pending',
      comment: '문의 상태'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      comment: '우선순위'
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '답변 내용'
    },
    answeredBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '답변한 관리자 ID'
    },
    answeredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '답변 일시'
    },
  },
  {
    sequelize,
    tableName: 'inquiries',
    timestamps: true
  }
);

export default Inquiry;
