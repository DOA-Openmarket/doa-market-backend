import { Sequelize } from "sequelize";

export const sequelize = new Sequelize({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "doa_payments",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres123",
  dialect: "postgres",
  logging: false,
});
