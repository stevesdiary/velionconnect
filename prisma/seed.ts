import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Dev seed: create a test user
  await prisma.user.upsert({
    where: { email: 'dev@velionconnect.com' },
    update: {},
    create: {
      email: 'dev@velionconnect.com',
      fullName: 'Dev User',
      // password: "password" (bcrypt hash)
      passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1BmWFPdqU.',
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
