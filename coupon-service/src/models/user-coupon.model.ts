import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class UserCoupon extends Model {
  public id!: string;
  public userId!: string;
  public couponId!: string;
  public issuedAt!: Date;
  public usedAt?: Date;
}

UserCoupon.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    couponId: { type: DataTypes.UUID, allowNull: false },
    issuedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    usedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'user_coupons', timestamps: false }
);

export default UserCoupon;
