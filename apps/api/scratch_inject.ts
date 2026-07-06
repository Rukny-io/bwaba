import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const user = await prisma.user.findFirst({ include: { developerApps: true } });
  console.log('USER:', user?.email, 'APP_ID:', user?.developerApps[0]?.id);
}
run().catch(console.error).finally(() => prisma.$disconnect());
