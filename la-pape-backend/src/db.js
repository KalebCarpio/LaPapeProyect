import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT || 5432),
    dialect: "postgres",
    logging: false,
  }
);

export async function connectDB() {
  await sequelize.authenticate();
  console.log("✅ PostgreSQL conectado");
}