import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Seller extends Model {
  declare id: string;
  declare userId: string;
  declare storeName: string;
  declare businessNumber: string;
  declare status: string;
  declare verifiedAt?: Date;
  declare phone?: string;
  declare bankType?: string;
  declare bankAccount?: string;
  declare depositorName?: string;
  declare ceoName?: string;
}

Seller.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true },
    storeName: { type: DataTypes.STRING(100), allowNull: false },
    businessNumber: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('pending', 'verified', 'rejected', 'suspended'), defaultValue: 'pending' },
    verifiedAt: { type: DataTypes.DATE },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    bankType: { type: DataTypes.STRING(20), allowNull: true },
    bankAccount: { type: DataTypes.STRING(50), allowNull: true },
    depositorName: { type: DataTypes.STRING(100), allowNull: true },
    ceoName: { type: DataTypes.STRING(100), allowNull: true },
  },
  { sequelize, tableName: 'sellers' }
);

export default Seller;

