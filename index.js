const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({})

async function main() {
  const sarahPosts = await prisma.user.create({
    data: {
      name: 'Sarah',
      email: 'sarah@prisma.io',
      Post: {
        create: [
          { title: 'My first post', published: false },
          { title: 'All about databases', published: true },
          { title: 'Prisma Day 2020', published: false },
        ],
      },
    },
  })

  const emilyPosts = await prisma.user.create({
    data: {
      name: 'Emily',
      email: 'emily@prisma.io',
      Post: {
        create: [
          { title: 'My first post', published: false },
          { title: 'All about databases', published: true },
          { title: 'Prisma Day 2020', published: false },
        ],
      },
    },
  })

  const drafts = await prisma.draft.findMany({})

  console.log(drafts)

  const filteredDrafts = await prisma.draft.findMany({
    where: {
      email: 'sarah@prisma.io',
    },
  })

  console.log(filteredDrafts)
}

main()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
