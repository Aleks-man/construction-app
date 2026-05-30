import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma";

const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@test.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD || "123456";
const passwordSaltRounds = 10;

async function main() {
  if (adminPassword.trim().length < 6) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 6 characters");
  }

  const passwordHash = await bcrypt.hash(adminPassword.trim(), passwordSaltRounds);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail.trim().toLowerCase() },
    update: {
      password: passwordHash,
      firstName: "Demo",
      lastName: "Admin",
      phone: null,
      role: "ADMIN",
    },
    create: {
      email: adminEmail.trim().toLowerCase(),
      password: passwordHash,
      firstName: "Demo",
      lastName: "Admin",
      phone: null,
      role: "ADMIN",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  console.log(`Seeded admin user: ${admin.email} (${admin.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
