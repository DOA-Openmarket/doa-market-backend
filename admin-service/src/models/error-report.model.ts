import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ErrorReportAttributes {
  id: string;
  reporterId: string;
  reporterType: string; // USER, SELLER, PARTNER
  category: string;
  type: string;
  title: string;
  content: string;
  status: string; // PENDING, IN_PROGRESS, RESOLVED, CLOSED
  answer?: string;
  answeredBy?: string;
  answeredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ErrorReportCreationAttributes extends Optional<ErrorReportAttributes, 'id' | 'createdAt' | 'updatedAt' | 'answer' | 'answeredBy' | 'answeredAt'> {}

class ErrorReport extends Model<ErrorReportAttributes, ErrorReportCreationAttributes> implements ErrorReportAttributes {
  public id!: string;
  public reporterId!: string;
  public reporterType!: string;
  public category!: string;
  public type!: string;
  public title!: string;
  public content!: string;
  public status!: string;
  public answer?: string;
  public answeredBy?: string;
  public answeredAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ErrorReport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reporterType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'PENDING',
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    answeredBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    answeredAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'error_reports',
    timestamps: true,
  }
);

export default ErrorReport;
