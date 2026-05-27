const fs = require("fs")

async function runTests() {
  const BASE_URL = "http://localhost:3002"
  const CRON_SECRET = process.env.CRON_SECRET
  if (!CRON_SECRET) {
    throw new Error(
      "CRON_SECRET is required to test /api/v1/cron/send-newsletters"
    )
  }
  let cookie = ""

  console.log("--- 1. Creating a User ---")
  // 1. Create User
  const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      name: "Test User",
      email: `test${Date.now()}@example.com`,
      password: "password12345",
    }),
  })

  if (signUpRes.ok) {
    console.log("✅ User created successfully!")
    // Extract the session cookie
    const setCookie = signUpRes.headers.get("set-cookie")
    if (setCookie) {
      cookie = setCookie.split(";")[0]
      console.log("🔑 Session Cookie obtained:", cookie)
    }
  } else {
    const err = await signUpRes.json()
    console.error("❌ Failed to create user:", err)
    return
  }

  console.log("\n--- 2. Setting User Preferences ---")
  // 2. Set Preferences
  const setPrefRes = await fetch(`${BASE_URL}/api/v1/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      receiveEmails: true,
      emailFrequency: "DAILY",
      // Optional: categoryIds: ["..."], tagIds: ["..."]
    }),
  })

  if (setPrefRes.ok) {
    const data = await setPrefRes.json()
    console.log("✅ Preferences updated successfully:", data)
  } else {
    const err = await setPrefRes.json()
    console.error("❌ Failed to update preferences:", err)
  }

  console.log("\n--- 3. Getting User Preferences ---")
  // 3. Get Preferences
  const getPrefRes = await fetch(`${BASE_URL}/api/v1/preferences`, {
    method: "GET",
    headers: {
      Cookie: cookie,
    },
  })

  if (getPrefRes.ok) {
    const data = await getPrefRes.json()
    console.log("✅ Fetched preferences:", data)
  } else {
    const err = await getPrefRes.json()
    console.error("❌ Failed to fetch preferences:", err)
  }

  console.log("\n--- 4. Testing Email Sending Service (Cron Trigger) ---")
  // 4. Test Email Sending
  const cronRes = await fetch(
    `${BASE_URL}/api/v1/cron/send-newsletters?frequency=DAILY`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    }
  )

  if (cronRes.ok) {
    const data = await cronRes.json()
    console.log("✅ Newsletter cron job executed successfully:", data)
  } else {
    const err = await cronRes.json()
    console.error("❌ Failed to execute cron job:", err)
  }
}

runTests()
