import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface CategoryAttributes {
  categoryId: string;
  name: string;
  slug: string;
  parentId?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CategoryCreationAttributes
  extends Optional<
    CategoryAttributes,
    | "categoryId"
    | "parentId"
    | "displayOrder"
    | "isActive"
    | "createdAt"
    | "updatedAt"
  > {}

class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  declare categoryId: string;
  declare name: string;
  declare slug: string;
  declare parentId: string | null;
  declare displayOrder: number;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Category.init(
  {
    categoryId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "categories",
        key: "categoryId",
      },
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "categories",
    timestamps: true,
  }
);

// Self-referencing relationship
Category.hasMany(Category, {
  as: "subcategories",
  foreignKey: "parentId",
});

Category.belongsTo(Category, {
  as: "parent",
  foreignKey: "parentId",
});

export default Category;
