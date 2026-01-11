import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Settlement extends Model {
  public id!: string;
  public sellerId!: string;
  public startDate!: Date;
  public endDate!: Date;
  public totalAmount!: number;
  public feeAmount!: number;
  public netAmount!: number;
  public status!: string;
}

Settlement.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sellerId: { type: DataTypes.UUID, allowNull: false },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    feeAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    netAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'calculated', 'paid', 'failed'), defaultValue: 'pending' },
  },
  { sequelize, tableName: 'settlements' }
);

export default Settlement;

