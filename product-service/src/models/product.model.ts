import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Product extends Model {
  public id!: string;
  public sellerId!: string;
  public categoryId!: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public price!: number;
  public originalPrice?: number;
  public status!: string;
  public stockQuantity!: number;
  public thumbnail?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sellerId: { type: DataTypes.UUID, allowNull: false },
    categoryId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), unique: true },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    originalPrice: { type: DataTypes.DECIMAL(10, 2) },
    status: { type: DataTypes.ENUM('draft', 'active', 'inactive', 'out_of_stock'), defaultValue: 'draft' },
    stockQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    thumbnail: { type: DataTypes.TEXT },
  },
  { sequelize, tableName: 'products', timestamps: true }
);

export default Product;

