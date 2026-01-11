import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Policy extends Model {
  public id!: string;
  public type!: string;
  public title!: string;
  public content!: string;
  public version!: string;
  public status!: string;
  public effectiveDate?: Date;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Policy.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('이용약관', '개인정보처리방침', '환불정책', '배송정책', '판매자정책'),
      allowNull: false,
      comment: '정책 유형'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '정책 제목'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '정책 내용'
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '1.0.0',
      comment: '버전'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'archived'),
      defaultValue: 'draft',
      comment: '정책 상태'
    },
    effectiveDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '시행일'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '작성자 ID'
    },
  },
  {
    sequelize,
    tableName: 'policies',
    timestamps: true
  }
);

export default Policy;
