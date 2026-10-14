import { z } from 'zod'

// Server-only settings. None of these may use a VITE_ prefix: Vite would bundle them into the frontend.

export class ConfigError extends Error {}

const mongoSchema = z.object({
  MONGODB_URI: z.string().min(1).refine((value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://')),
  MONGODB_DB_NAME: z.string().min(1),
})

const authSchema = z.object({
  JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
})

function parse<T>(schema: z.ZodType<T>, name: string): T {
  const result = schema.safeParse(process.env)
  // Only the variable names go into the error, never their values.
  if (!result.success) throw new ConfigError(`${name} is not configured: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`)
  return result.data
}

export const mongoEnv = () => parse(mongoSchema, 'MongoDB')
export const authEnv = () => parse(authSchema, 'Auth')

/** Extra origins allowed to call the API with credentials (comma-separated). Same-origin calls never need this. */
export const allowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)
