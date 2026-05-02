import { UserSession } from "@workspace/auth/types/user-session"
import { Role } from "@workspace/db/types/enums"
import { Request } from "express"

export type RequestWithSession = Request & {
  session: UserSession & { user: { role: Role } }
}
