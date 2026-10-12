import { z } from 'zod'
import { newPasswordSchema } from './auth.ts'

// Shared by the settings form and /api/profile, so both sides normalize and reject the same input.

export const PROFILE_LIMITS = { name: 60, bio: 500, tag: 30, hobbies: 10, techStack: 20 } as const

/** Trimmed, blank entries dropped, duplicates (case-insensitive) removed keeping the first spelling. */
const tagList = (label: string, max: number) => z
  .array(z.string().trim().max(PROFILE_LIMITS.tag, { error: `Keep each ${label} under ${PROFILE_LIMITS.tag + 1} characters` }), {
    error: `Send ${label}s as a list`,
  })
  .transform((tags) => {
    const seen = new Set<string>()
    return tags.filter((tag) => {
      const key = tag.toLowerCase()
      if (!tag || seen.has(key)) return false
      seen.add(key)
      return true
    })
  })
  .pipe(z.array(z.string()).max(max, { error: `Add at most ${max} ${label}s` }))

export const profileUpdateSchema = z.object({
  name: z.string().trim().max(PROFILE_LIMITS.name, { error: `Use at most ${PROFILE_LIMITS.name} characters` })
    .transform((name) => name || null),
  hobbies: tagList('hobby', PROFILE_LIMITS.hobbies),
  techStack: tagList('technology', PROFILE_LIMITS.techStack),
  bio: z.string().trim().max(PROFILE_LIMITS.bio, { error: `Use at most ${PROFILE_LIMITS.bio} characters` }),
}).strict()

export const changePasswordSchema = z.object({
  // Optional: Google-only accounts set their first password without one. The service decides when it is required.
  currentPassword: z.string().max(1024).optional(),
  newPassword: newPasswordSchema,
}).strict()

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export type Profile = { hobbies: string[]; techStack: string[]; bio: string }
