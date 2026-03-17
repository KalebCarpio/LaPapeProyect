// src/models/Product.js
import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: { type: DataTypes.STRING(160), allowNull: false },
    sku: { type: DataTypes.STRING(60), allowNull: true, unique: true },

    description: { type: DataTypes.TEXT, allowNull: true },

    category: { type: DataTypes.STRING(80), allowNull: true },
    brand: { type: DataTypes.STRING(80), allowNull: true },

    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    imageUrl: { type: DataTypes.TEXT, allowNull: true },

    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "products",
    timestamps: true,
    underscored: true,
  }
);

export default Product;