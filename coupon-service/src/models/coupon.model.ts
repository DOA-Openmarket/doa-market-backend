import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Coupon extends Model {
  public id!: string;
  public code!: string;
  public name!: string;
  public discountType!: string;
  public discountValue!: number;
  public minOrderAmount?: number;
  public maxDiscountAmount?: number;
  public startDate!: Date;
  public endDate!: Date;
  public status!: string;
}

Coupon.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    discountType: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false },
    discountValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    minOrderAmount: { type: DataTypes.DECIMAL(10, 2) },
    maxDiscountAmount: { type: DataTypes.DECIMAL(10, 2) },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM('active', 'inactive', 'expired'), defaultValue: 'active' },
  },
  { sequelize, tableName: 'coupons' }
);

export default Coupon;

