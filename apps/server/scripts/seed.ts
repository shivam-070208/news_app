import "../src/env"
import { db, Role, ArticleStatus, CommentStatus } from "@workspace/db"

async function main() {
  console.log("Seeding database...")

  // 1. Categories
  const categoryNames = [
    "Cricket",
    "Politics",
    "Education",
    "Investment",
    "Technology",
    "Health",
    "Sports",
    "Business",
    "Entertainment",
    "Science",
  ]

  const categories = []
  for (const name of categoryNames) {
    const slug = name.toLowerCase()
    const cat = await db.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    })
    categories.push(cat)
  }
  console.log(`✅ Seeded ${categories.length} categories.`)

  // 2. Tags
  const tagNames = [
    "Breaking",
    "Trending",
    "Exclusive",
    "Analysis",
    "Interview",
    "Live",
    "Update",
  ]
  const tags = []
  for (const name of tagNames) {
    const tag = await db.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    tags.push(tag)
  }
  console.log(`✅ Seeded ${tags.length} tags.`)

  // 3. Users (Authors & Readers)
  const author = await db.user.upsert({
    where: { email: "author@news.com" },
    update: {},
    create: {
      email: "author@news.com",
      name: "Lead Journalist",
      role: Role.EDITOR,
      emailVerified: true,
    },
  })

  const reader = await db.user.upsert({
    where: { email: "reader@news.com" },
    update: {},
    create: {
      email: "reader@news.com",
      name: "Avid Reader",
      role: Role.READER,
      emailVerified: true,
    },
  })
  console.log(`✅ Seeded authors and readers.`)

  // 4. Articles and Comments
  console.log("Seeding articles for each category...")
  let articleCount = 0

  for (const cat of categories) {
    // Create 2 articles per category
    for (let i = 1; i <= 2; i++) {
      const title = `${cat.name} News ${i}: The latest updates and insights`
      const slug = `${cat.slug}-news-${i}-${Date.now()}`

      const randomTag = tags[Math.floor(Math.random() * tags.length)]

      const article = await db.article.create({
        data: {
          title,
          slug,
          summary: `This is a brief summary of the latest happenings in ${cat.name}. Discover what is changing the landscape today.`,
          fullContent: `Here is the full detailed content for the ${cat.name} article. It discusses various important points and gives an in-depth analysis of the current situation. With experts weighing in, it's clear that this development will have lasting impacts on the industry. Stay tuned for more updates.`,
          thumbnailUrl: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80`,
          authorId: author.id,
          categoryId: cat.id,
          status: ArticleStatus.PUBLISHED,
          publishedAt: new Date(),
          isBreaking: i === 1, // First article of each cat is breaking
          viewCount: Math.floor(Math.random() * 1000),
          tags: {
            create: [{ tagId: randomTag.id }],
          },
        },
      })
      articleCount++

      // 5. Comments
      await db.comment.create({
        data: {
          articleId: article.id,
          userId: reader.id,
          body: `Great article on ${cat.name}! I really enjoyed reading this and it offered some fantastic insights.`,
          status: CommentStatus.APPROVED,
        },
      })
    }
  }

  console.log(`✅ Seeded ${articleCount} articles with tags and comments.`)
  console.log("🎉 Comprehensive Seeding complete!")
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:")
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
