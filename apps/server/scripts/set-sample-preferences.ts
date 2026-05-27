import "../src/env"
import { db, EmailFrequency } from "@workspace/db"

async function main() {
  const BASE_URL = "http://localhost:3002"

  // 1. Fetch all categories directly from DB to avoid API error
  const categories = await db.category.findMany()

  if (categories.length === 0) {
    console.error("No categories found via API!")
    return
  }

  // Pick the first 3 categories
  const selectedCategories = categories.slice(0, 3)
  const categoryIds = selectedCategories.map((c: any) => c.id)
  console.log(
    `Selected Categories: ${selectedCategories.map((c: any) => c.name).join(", ")}`
  )

  // 2. Create a new sample user via API to get a valid session cookie
  const email = `api_user_${Date.now()}@example.com`
  console.log(`\nCreating user via API: ${email}`)

  const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      name: "Sample API User",
      email: email,
      password: "password12345",
    }),
  })

  let cookie = ""
  if (signUpRes.ok) {
    console.log("✅ User created successfully!")
    const setCookie = signUpRes.headers.get("set-cookie")
    if (setCookie) {
      cookie = setCookie.split(";")[0]
      console.log("🔑 Session Cookie obtained")
    }
  } else {
    const err = await signUpRes.json()
    console.error("❌ Failed to create user:", err)
    return
  }

  // 3. Hit the preferences API using the valid session cookie
  console.log("\nUpdating preferences via API...")
  const setPrefRes = await fetch(`${BASE_URL}/api/v1/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      receiveEmails: true,
      emailFrequency: EmailFrequency.DAILY,
      categoryIds,
      tagIds: [],
    }),
  })

  if (setPrefRes.ok) {
    const data = await setPrefRes.json()
    console.log("✅ Preferences updated successfully:", data)
  } else {
    const err = await setPrefRes.json()
    console.error("❌ Failed to update preferences:", err)
  }

  // Verify using GET preferences
  const getPrefRes = await fetch(`${BASE_URL}/api/v1/preferences`, {
    method: "GET",
    headers: { Cookie: cookie },
  })
  if (getPrefRes.ok) {
    const prefData = await getPrefRes.json()
    console.log("✅ Verified fetched preferences:", prefData.data.categoryIds)
  }

  await db.$disconnect()
}

main().catch(console.error)
