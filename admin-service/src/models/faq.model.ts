import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface FaqAttributes {
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

interface FaqCreationAttributes extends Optional<FaqAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'displayOrder' | 'category'> {}

class Faq extends Model<FaqAttributes, FaqCreationAttributes> implements FaqAttributes {
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

Faq.init(
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
    tableName: 'faqs',
    timestamps: true,
  }
);

export default Faq;
