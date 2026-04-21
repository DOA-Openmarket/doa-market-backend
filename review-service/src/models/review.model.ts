import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Review extends Model {
  public id!: string;
  public userId!: string;
  public userName!: string;
  public productId!: string;
  public sellerId!: string;
  public orderId!: string;
  public rating!: number;
  public content!: string;
  public images!: string[];
  public status!: string;
}

Review.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    userName: { type: DataTypes.STRING(100), allowNull: true, defaultValue: '익명' },
    productId: { type: DataTypes.UUID, allowNull: false },
    sellerId: { type: DataTypes.UUID, allowNull: true },
    orderId: { type: DataTypes.UUID, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    content: { type: DataTypes.TEXT, allowNull: false },
    images: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  },
  { sequelize, tableName: 'reviews' }
);

export default Review;

