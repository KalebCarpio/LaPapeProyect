import { Sequelize } from "sequelize";

const databaseUrl = (process.env.DATABASE_URL || "").trim();

export const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: "postgres",
      logging: false,
      dialectOptions:
        process.env.PG_SSL === "true"
          ? {
              ssl: {
                require: true,
                rejectUnauthorized: false,
              },
            }
          : undefined,
    })
  : new Sequelize(
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
