import dotenv from "dotenv";
import { SignOptions } from "jsonwebtoken";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });


export const config = {
  port: Number(process.env.PORT) || 5000,
  database_url: process.env.DATABASE_URL || "",
  jwt_secret: process.env.JWT_SECRET!,
  jwt_expiresIn: process.env.JWT_EXPIRESIN as SignOptions["expiresIn"],
  stripe_secret_key: process.env.STRIPE_SECRET_KEY || "",
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || "",
  google_client_id:
    process.env.GOOGLE_CLIENT_ID ||
    "demo-google-client-id.apps.googleusercontent.com",
  google_client_secret:
    process.env.GOOGLE_CLIENT_SECRET || "demo-google-client-secret",
  google_callback_url:
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:5000/api/v1/auth/google/callback",
  client_url: process.env.CLIENT_URL || "http://localhost:3000",
};

