import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
  declare id: CreationOptional<string>;
  declare orderId: string;
  declare amount: number;
  declare method: string;
  declare status: string;
  declare pgTransactionId: CreationOptional<string | null>;
  declare paidAt: CreationOptional<Date | null>;
}

Payment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    method: { type: DataTypes.ENUM('card', 'transfer', 'virtual_account', 'mobile'), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'), defaultValue: 'pending' },
    pgTransactionId: { type: DataTypes.STRING(255) },
    paidAt: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'payments' }
);

export default Payment;

