import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Review extends Model {
  public id!: string;
  public userId!: string;
  public productId!: string;
  public orderId!: string;
  public rating!: number;
  public content!: string;
  public status!: string;
}

Review.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    productId: { type: DataTypes.UUID, allowNull: false },
    orderId: { type: DataTypes.UUID, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    content: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  },
  { sequelize, tableName: 'reviews' }
);

export default Review;

