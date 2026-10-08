import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma";
import jwt from "jsonwebtoken";
import { config } from "../../config";
import { createAuditLog } from "../auditLog/auditLog.service";
export interface IRegisterUserPayload {
  name: string;
  email: string;
  password: string;
}
export interface ILoginUserPayload {
  email: string;
  password: string;
}

// Service to register a new citizen
export const registerCitizenIntoDB = async (payload: IRegisterUserPayload) => {
  // 1. Check if a user with the given email already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  // 2. Hash password with bcryptjs (salt rounds = 10)
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // 3. Create user in database with role strictly set to CITIZEN
  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: "CITIZEN",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return newUser;
};



export const loginCitizenIntoDB = async (payload: ILoginUserPayload) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
  });

  if (!user.isActive) {
    throw new Error("Your account is inactive");
  }

  if (!user.password) {
    throw new Error(
      "This account was created with Google login. Please sign in with Google."
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new Error("Invalid email or password");
  }

  const jwtPayload = {
    id: user.id,
    role: user.role,
  };

  const token = jwt.sign(jwtPayload, config.jwt_secret, {
    expiresIn: config.jwt_expiresIn,
  });

  // Audit log successful login (never log passwords)
  await createAuditLog({
    userId: user.id,
    action: "LOGIN",
    entity: "AUTH",
    entityId: user.id,
    description: "User logged in successfully",
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    token,
  };
};

// Service to fetch current user profile by user ID
export const getCurrentUserFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
};

// ==========================================
// Google / GCP Social Authentication Methods
// ==========================================

export const getGoogleAuthUrl = () => {
  if (!config.google_client_id) {
    throw new Error(
      "GOOGLE_CLIENT_ID is not configured. Please set GOOGLE_CLIENT_ID in your environment."
    );
  }

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: config.google_callback_url,
    client_id: config.google_client_id,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
};

interface IGoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

// Common helper to authenticate or register a Google user
export const authenticateOrRegisterGoogleUser = async ({
  googleId,
  email,
  name,
}: IGoogleProfile) => {
  if (!email) {
    throw new Error("Google account must provide a verified email address");
  }

  // 1. Find user by googleId
  let user = await prisma.user.findUnique({
    where: { googleId },
  });

  // 2. If not found by googleId, find by email
  if (!user) {
    user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Link googleId to existing account without elevating or changing role
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    } else {
      // 3. Create new user strictly as CITIZEN
      user = await prisma.user.create({
        data: {
          name: name || "Google Citizen",
          email,
          googleId,
          role: "CITIZEN",
          isActive: true,
        },
      });
    }
  }

  // Verify account is active
  if (!user.isActive) {
    throw new Error("Your account is inactive");
  }

  // Generate standard JWT token with id and role
  const jwtPayload = {
    id: user.id,
    role: user.role,
  };

  const token = jwt.sign(jwtPayload, config.jwt_secret, {
    expiresIn: config.jwt_expiresIn,
  });

  // Audit log Google login
  await createAuditLog({
    userId: user.id,
    action: "LOGIN",
    entity: "AUTH",
    entityId: user.id,
    description: "User logged in with Google OAuth",
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    token,
  };
};

// Handle OAuth 2.0 authorization code callback
export const handleGoogleOAuthCallback = async (code: string) => {
  if (!config.google_client_id || !config.google_client_secret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  // 1. Exchange authorization code for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.google_client_id,
      client_secret: config.google_client_secret,
      redirect_uri: config.google_callback_url,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw new Error(`Failed to exchange code with Google: ${errorBody}`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };

  // 2. Retrieve user profile using Google userinfo API
  const userResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    }
  );

  if (!userResponse.ok) {
    throw new Error("Failed to fetch Google user profile");
  }

  const profile = (await userResponse.json()) as {
    sub: string;
    email: string;
    name: string;
  };

  return authenticateOrRegisterGoogleUser({
    googleId: profile.sub,
    email: profile.email,
    name: profile.name,
  });
};

// Handle direct ID token verification (compatible with SPAs, mobile, and Postman testing)
export const handleGoogleIdToken = async (idToken: string) => {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
      idToken
    )}`
  );

  if (!response.ok) {
    throw new Error("Invalid Google ID token");
  }

  const profile = (await response.json()) as {
    sub: string;
    email: string;
    name: string;
  };

  return authenticateOrRegisterGoogleUser({
    googleId: profile.sub,
    email: profile.email,
    name: profile.name,
  });
};
