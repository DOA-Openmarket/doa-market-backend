import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Seller extends Model {
  declare id: string;
  declare userId: string;
  declare storeName: string;
  declare businessNumber: string;
  declare status: string;
  declare verifiedAt?: Date;
}

Seller.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true },
    storeName: { type: DataTypes.STRING(100), allowNull: false },
    businessNumber: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('pending', 'verified', 'rejected', 'suspended'), defaultValue: 'pending' },
    verifiedAt: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'sellers' }
);

export default Seller;

