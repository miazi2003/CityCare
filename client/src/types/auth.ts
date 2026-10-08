import type { IsoDateTime } from "./api";

export type UserRole = "CITIZEN" | "STAFF" | "ADMIN";

export type UserIdentity = {
  id: string;
  name: string;
  email: string;
};

export type User = UserIdentity & {
  role: UserRole;
};

export type AuthUser = User & {
  isActive: boolean;
};

export type RegisteredUser = AuthUser & {
  createdAt: IsoDateTime;
};

export type CurrentUser = RegisteredUser;

export type LoginResponse = {
  user: AuthUser;
  token: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name: string;
};

export type GoogleAuthInput = {
  idToken: string;
};

export type GoogleAuthUrlResponse = {
  url: string;
};
