import { z } from "zod"

export const updatePreferencesSchema = z.object({
  categoryIds: z
    .array(z.string().cuid({ message: "Each categoryId must be a valid CUID" }))
    .optional(),
  tagIds: z
    .array(z.string().cuid({ message: "Each tagId must be a valid CUID" }))
    .optional(),
  receiveEmails: z.boolean().optional(),
  emailFrequency: z.enum(["DAILY", "WEEKLY"]).optional(),
})

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>
