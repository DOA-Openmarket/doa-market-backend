import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Banner extends Model {
  public id!: string;
  public title!: string;
  public link?: string;
  public imageUrl!: string;
  public ownerType!: 'ADVERTISER' | 'PARTNER';
  public ownerId?: string;
  public displayOrder!: number;
  public isActive!: boolean;
  public startDate?: Date;
  public endDate?: Date;
}

Banner.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    link: { type: DataTypes.STRING(500) },
    imageUrl: { type: DataTypes.STRING(500), allowNull: false },
    ownerType: { type: DataTypes.ENUM('ADVERTISER', 'PARTNER'), allowNull: false },
    ownerId: { type: DataTypes.UUID },
    displayOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    startDate: { type: DataTypes.DATE },
    endDate: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'banners', timestamps: true }
);

export default Banner;

