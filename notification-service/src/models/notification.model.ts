import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Notification extends Model {
  public id!: string;
  public userId!: string;
  public type!: string;
  public title!: string;
  public message!: string;
  public status!: string;
  public sentAt?: Date;
}

Notification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.ENUM('push', 'email', 'sms'), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'sent', 'failed'), defaultValue: 'pending' },
    sentAt: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'notifications' }
);

export default Notification;

