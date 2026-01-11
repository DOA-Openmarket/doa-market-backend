import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface GuideAttributes {
  id: string;
  title: string;
  content: string;
  type: string; // CUSTOMER, PARTNER, SELLER
  category?: string;
  displayOrder?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GuideCreationAttributes extends Optional<GuideAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'displayOrder' | 'category'> {}

class Guide extends Model<GuideAttributes, GuideCreationAttributes> implements GuideAttributes {
  public id!: string;
  public title!: string;
  public content!: string;
  public type!: string;
  public category?: string;
  public displayOrder?: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Guide.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'CUSTOMER',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'guides',
    timestamps: true,
  }
);

export default Guide;
