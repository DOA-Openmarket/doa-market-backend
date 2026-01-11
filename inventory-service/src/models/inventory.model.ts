import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Inventory extends Model {
  public id!: string;
  public productId!: string;
  public quantity!: number;
  public reservedQuantity!: number;
  public availableQuantity!: number;
}

Inventory.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.UUID, allowNull: false, unique: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    reservedQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    availableQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'inventory' }
);

export default Inventory;

