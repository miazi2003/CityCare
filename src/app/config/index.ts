import dotenv from "dotenv";
import { SignOptions } from "jsonwebtoken";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });


export const config = {
  port: Number(process.env.PORT) || 5000,
  database_url: process.env.DATABASE_URL || "",
  jwt_secret: process.env.JWT_SECRET!,
  jwt_expiresIn: process.env.JWT_EXPIRESIN as SignOptions["expiresIn"],
};

