import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@nobrainy.dev' },
    update: {},
    create: {
      email: 'test@nobrainy.dev',
      name: 'Test User',
      provider: 'email',
      passwordHash: '$2a$12$LJ3tJMfVmRYGQ1E/axGiZ.rvSz5dlqkXMsNnKqW2r0V7FjB7Gkuiq',
      timezone: 'Asia/Kolkata',
    },
  })

  console.log(`Created user: ${user.email}`)
  console.log('✅ Seeding complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
