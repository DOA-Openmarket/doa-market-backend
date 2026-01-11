import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Shipping extends Model {
  public id!: string;
  public orderId!: string;
  public trackingNumber?: string;
  public carrier!: string;
  public status!: string;
  public dispatchedAt?: Date;
  public deliveredAt?: Date;
}

Shipping.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false },
    trackingNumber: { type: DataTypes.STRING(100) },
    carrier: { type: DataTypes.ENUM('cj', 'logen', 'hanjin', 'kdex'), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'dispatched', 'in_transit', 'delivered', 'failed'), defaultValue: 'pending' },
    dispatchedAt: { type: DataTypes.DATE },
    deliveredAt: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'shippings' }
);

export default Shipping;

