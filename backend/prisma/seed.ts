import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const DEMO_PASSWORD = "CityCare2026!";

export const DEMO_ACCOUNTS = {
  CITIZEN: {
    email: "demo.citizen@citycare.test",
    name: "Demo Citizen",
    role: UserRole.CITIZEN,
  },
  STAFF: {
    email: "demo.staff@citycare.test",
    name: "Demo Staff Member",
    role: UserRole.STAFF,
  },
  ADMIN: {
    email: "demo.admin@citycare.test",
    name: "Demo Administrator",
    role: UserRole.ADMIN,
  },
} as const;

async function main() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Ensure at least one active department exists for Staff assignment
  let defaultDepartment = await prisma.department.findFirst({
    where: { isActive: true },
  });

  if (!defaultDepartment) {
    defaultDepartment = await prisma.department.upsert({
      where: { name: "Public Works & Infrastructure" },
      update: { isActive: true },
      create: {
        name: "Public Works & Infrastructure",
        description: "Municipal infrastructure, sanitation, and street maintenance.",
        isActive: true,
      },
    });
  }

  // 2. Idempotently upsert Demo Citizen
  await prisma.user.upsert({
    where: { email: DEMO_ACCOUNTS.CITIZEN.email },
    update: {
      name: DEMO_ACCOUNTS.CITIZEN.name,
      password: hashedPassword,
      role: DEMO_ACCOUNTS.CITIZEN.role,
      isActive: true,
    },
    create: {
      email: DEMO_ACCOUNTS.CITIZEN.email,
      name: DEMO_ACCOUNTS.CITIZEN.name,
      password: hashedPassword,
      role: DEMO_ACCOUNTS.CITIZEN.role,
      isActive: true,
    },
  });

  // 3. Idempotently upsert Demo Staff
  await prisma.user.upsert({
    where: { email: DEMO_ACCOUNTS.STAFF.email },
    update: {
      name: DEMO_ACCOUNTS.STAFF.name,
      password: hashedPassword,
      role: DEMO_ACCOUNTS.STAFF.role,
      departmentId: defaultDepartment.id,
      isActive: true,
    },
    create: {
      email: DEMO_ACCOUNTS.STAFF.email,
      name: DEMO_ACCOUNTS.STAFF.name,
      password: hashedPassword,
      role: DEMO_ACCOUNTS.STAFF.role,
      departmentId: defaultDepartment.id,
      isActive: true,
    },
  });

  // 4. Idempotently upsert Demo Admin
  await prisma.user.upsert({
    where: { email: DEMO_ACCOUNTS.ADMIN.email },
    update: {
      name: DEMO_ACCOUNTS.ADMIN.name,
      password: hashedPassword,
      role: DEMO_ACCOUNTS.ADMIN.role,
      isActive: true,
    },
    create: {
      email: DEMO_ACCOUNTS.ADMIN.email,
      name: DEMO_ACCOUNTS.ADMIN.name,
      password: hashedPassword,
      role: DEMO_ACCOUNTS.ADMIN.role,
      isActive: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

