import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../../config";

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


export const loginCitizenIntoDB = async (payload : ILoginUserPayload) =>{
const user = await prisma.user.findUniqueOrThrow({
  where : {
    email : payload.email
  }
})


if (!user) {
  throw new Error("Invalid email or password");
}

if (!user.isActive) {
  throw new Error("Your account is inactive");
}

const isPasswordMatched = await bcrypt.compare(
  payload.password,
  user.password
)

if(!isPasswordMatched){
  throw new Error ("Invalid email or password")
}

const jwtPayload = {
  id : user.id,
  role : user.role
}

const token = jwt.sign(jwtPayload , config.jwt_secret, {
  expiresIn : config.jwt_expiresIn}
 )


 return {
  user : {
    id : user.id ,
    email : user.email,
    name : user.name ,
    role : user.role,
    isActive : user.isActive
  },
  token
 }

}

