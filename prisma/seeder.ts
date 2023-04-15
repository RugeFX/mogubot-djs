import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const rugee = await prisma.user.create({
    data: { discordId: 588715830825451553 },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
