import "dotenv/config"
import { db } from "@workspace/db"
import {
  betterAuth,
  type BetterAuthOptions,
  type Auth as BetterAuth,
} from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET

if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET) {
  throw new Error("Missing required Google OAuth credentials")
}

const options: BetterAuthOptions = {
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
    },
  },
}

const auth = betterAuth(options)

export { auth }
export type Auth = BetterAuth<BetterAuthOptions>
