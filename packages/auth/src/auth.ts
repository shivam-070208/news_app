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
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL
const ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) || []

const options: BetterAuthOptions = {
  appName: "Admin Console",
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
    },
  },
  trustedOrigins: ALLOWED_ORIGINS,
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      console.log(`Send verification email to ${user.email}: ${url}`)
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "READER",
      },
    },
  },
}

const auth = betterAuth(options)

export { auth }
export type Auth = BetterAuth<BetterAuthOptions>
