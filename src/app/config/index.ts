import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const config = {
  port: Number(process.env.PORT) || 5000,
  database_url: process.env.DATABASE_URL || "",
};

