import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Build-time configuration checks (run by `npm run build`, locally and on Netlify).
// Every message names variables only; secret values never appear in output or lesson files.

export type Env = Record<string, string | undefined>

/** A problem that fails the build. `id` names the lesson file: `.claude/lessons/<id>.md`. */
export type BuildIssue = { id: string; title: string; detail: string; fix: string }

const GOOGLE_CLIENT_ID = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/
const SECRET_NAMES = ['JWT_SECRET', 'MONGODB_URI', 'GOOGLE_CLIENT_SECRET'] as const
const MONGODB_PLACEHOLDER = /<[^>]+>|replace|your-|example\.mongodb\.net|user:pass(word)?@/i
const SECRET_LOOKING_VITE = /^VITE_.*(SECRET|PASSWORD|MONGODB|JWT|PRIVATE)/

/** Netlify builds (production and previews) deploy functions, so backend settings are required there. */
export const isNetlifyBuild = (env: Env) => env.NETLIFY === 'true'

export function checkEnv(env: Env): BuildIssue[] {
  const issues: BuildIssue[] = []
  const requireBackend = isNetlifyBuild(env)
  const frontendId = env.VITE_GOOGLE_CLIENT_ID
  const backendId = env.GOOGLE_CLIENT_ID

  for (const [name, value] of [['VITE_GOOGLE_CLIENT_ID', frontendId], ['GOOGLE_CLIENT_ID', backendId]] as const) {
    if (value !== undefined && value !== '' && !GOOGLE_CLIENT_ID.test(value)) {
      issues.push({
        id: `google-client-id-malformed-${name.toLowerCase().replace(/_/g, '-')}`,
        title: `${name} is not a Google OAuth Client ID`,
        detail: value.startsWith('your-')
          ? `${name} is still the \`.env.example\` placeholder, so Google answers "The OAuth client was not found" (401 invalid_client).`
          : `${name} must look like \`<digits>-<letters/digits>.apps.googleusercontent.com\` with no spaces, quotes or line breaks.`,
        fix: `Copy the Client ID (not the client secret) from Google Cloud Console → Credentials and set ${name} to exactly that value.`,
      })
    }
  }

  if (frontendId && backendId && frontendId !== backendId) {
    issues.push({
      id: 'google-client-id-mismatch',
      title: 'VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID differ',
      detail: 'The browser gets tokens for one client while the server verifies them against another, so every Google sign-in fails with 401.',
      fix: 'Set both variables to the same Client ID, then restart the dev server or redeploy.',
    })
  }
  if (Boolean(frontendId) !== Boolean(backendId) && (requireBackend || backendId)) {
    issues.push({
      id: 'google-client-id-half-configured',
      title: 'Only one of VITE_GOOGLE_CLIENT_ID / GOOGLE_CLIENT_ID is set',
      detail: frontendId
        ? 'The Google button is shown, but the server cannot verify Google tokens (503).'
        : 'The server accepts Google tokens, but the frontend hides the Google button.',
      fix: 'Set both to the same Client ID, or remove both to turn Google sign-in off.',
    })
  }

  const jwtSecret = env.JWT_SECRET
  if (jwtSecret ? jwtSecret.length < 32 : requireBackend) {
    issues.push({
      id: 'jwt-secret-invalid',
      title: jwtSecret ? 'JWT_SECRET is shorter than 32 characters' : 'JWT_SECRET is missing',
      detail: 'Sessions cannot be signed or verified, so sign-in and progress return 503.',
      fix: 'Generate one with `openssl rand -base64 48` and set JWT_SECRET (in `.env` locally, in Netlify environment variables for deploys).',
    })
  }

  const mongoUri = env.MONGODB_URI
  if (mongoUri ? !/^mongodb(\+srv)?:\/\//.test(mongoUri) : requireBackend) {
    issues.push({
      id: 'mongodb-uri-invalid',
      title: mongoUri ? 'MONGODB_URI is not a MongoDB connection string' : 'MONGODB_URI is missing',
      detail: 'The functions cannot reach Atlas, so accounts and progress return 503.',
      fix: 'Set MONGODB_URI to the Atlas connection string starting with `mongodb+srv://` (no quotes).',
    })
  }
  if (mongoUri && /^mongodb(\+srv)?:\/\//.test(mongoUri) && MONGODB_PLACEHOLDER.test(mongoUri)) {
    issues.push({
      id: 'mongodb-uri-placeholder',
      title: 'MONGODB_URI is still the .env.example placeholder',
      detail: 'Host, user or password are placeholder text, so every request that needs Atlas fails with 500 ("request failed").',
      fix: 'In Atlas → Database → Connect → Drivers, copy the real `mongodb+srv://` string, fill in the database user and its (rotated) password, and set MONGODB_URI.',
    })
  }
  if (requireBackend && !env.MONGODB_DB_NAME) {
    issues.push({
      id: 'mongodb-db-name-missing',
      title: 'MONGODB_DB_NAME is missing',
      detail: 'The functions do not know which Atlas database to use.',
      fix: 'Set MONGODB_DB_NAME in the Netlify environment variables.',
    })
  }

  const leakyNames = Object.keys(env).filter((name) => SECRET_LOOKING_VITE.test(name))
  if (leakyNames.length > 0) {
    issues.push({
      id: 'secret-with-vite-prefix',
      title: 'A secret-looking variable uses the VITE_ prefix',
      detail: `Vite bundles every VITE_ variable into public JavaScript: ${leakyNames.join(', ')}.`,
      fix: 'Rename it without the VITE_ prefix, rotate the value (it may already be public), and read it only in backend code.',
    })
  }

  return issues
}

/** Google answers an unknown client with an `authError` that contains `invalid_client`. */
export function googleAuthErrorCode(location: string | null): string | null {
  if (!location) return null
  const authError = new URL(location, 'https://accounts.google.com').searchParams.get('authError')
  if (!authError) return null
  const decoded = Buffer.from(authError, 'base64url').toString('latin1')
  return ['invalid_client', 'deleted_client', 'disabled_client', 'redirect_uri_mismatch'].find((code) => decoded.includes(code)) ?? 'unknown'
}

export type GoogleClientCheck = { issue: BuildIssue | null; warning: string | null }

/**
 * Asks Google whether the Client ID exists, the same lookup the sign-in popup does.
 * Network problems only warn: an offline build should not fail for this.
 */
export async function checkGoogleClient(clientId: string, fetchImpl: typeof fetch = fetch): Promise<GoogleClientCheck> {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'id_token',
    scope: 'openid',
    nonce: 'build-check',
    redirect_uri: 'http://localhost:5173',
  }).toString()

  let location: string | null
  try {
    const response = await fetchImpl(url, { redirect: 'manual', signal: AbortSignal.timeout(10_000) })
    location = response.headers.get('location')
  } catch {
    return { issue: null, warning: 'Could not reach Google to check the OAuth Client ID; skipped.' }
  }

  const code = googleAuthErrorCode(location)
  if (code === 'invalid_client' || code === 'deleted_client' || code === 'disabled_client') {
    return {
      issue: {
        id: 'google-client-not-found',
        title: `Google rejects the OAuth Client ID (${code})`,
        detail: 'Google sign-in shows "The OAuth client was not found" / "Error 401: invalid_client". The ID is well-formed, but no active client with that ID exists in Google Cloud.',
        fix: [
          'In Google Cloud Console → APIs & Services → Credentials (right account, right project), check the client exists.',
          'If it was deleted, restore it (about 30 days) or create a new Web client and put its ID in both VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID.',
          'A client created minutes ago may not be live yet: wait and rebuild.',
          'Restart `netlify dev` / redeploy afterwards: Vite reads VITE_ variables only at startup and build time.',
        ].join('\n'),
      },
      warning: null,
    }
  }
  if (code === null || code === 'unknown') {
    return { issue: null, warning: 'Google gave an unexpected answer for the OAuth Client ID check; skipped.' }
  }
  return { issue: null, warning: null }
}

export type ResolveSrv = (hostname: string) => Promise<unknown>

/**
 * Checks that the Atlas host in a `mongodb+srv://` URI exists in DNS (the driver's first step).
 * Only the host is looked up; the user and password are never used.
 */
export async function checkMongoHost(uri: string, resolveSrv: ResolveSrv): Promise<{ issue: BuildIssue | null; warning: string | null }> {
  const match = uri.match(/^mongodb\+srv:\/\/(?:[^@/]*@)?([^/?]+)/)
  if (!match) return { issue: null, warning: null }
  try {
    await resolveSrv(`_mongodb._tcp.${match[1]}`)
    return { issue: null, warning: null }
  } catch (cause) {
    const code = (cause as { code?: string }).code
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      return {
        issue: {
          id: 'mongodb-host-not-found',
          title: 'The Atlas host in MONGODB_URI does not exist',
          detail: `DNS has no MongoDB SRV record for the cluster host (${code}), so the functions cannot connect and requests that need Atlas fail with 500 ("request failed").`,
          fix: 'Copy the connection string again from Atlas → Database → Connect → Drivers; check the cluster name and that the cluster still exists (not paused or deleted).',
        },
        warning: null,
      }
    }
    return { issue: null, warning: 'Could not look up the Atlas host in DNS; skipped.' }
  }
}

/** Scans built files for the values of server-only secrets. */
export function findLeakedSecrets(env: Env, files: { path: string; content: string }[]): BuildIssue[] {
  const leaks = SECRET_NAMES.flatMap((name) => {
    const value = env[name]
    // Very short values would match by chance; real secrets are long.
    if (!value || value.length < 12) return []
    const hits = files.filter((file) => file.content.includes(value)).map((file) => file.path)
    return hits.length > 0 ? [`${name} in ${hits.join(', ')}`] : []
  })
  if (leaks.length === 0) return []
  return [{
    id: 'secret-in-frontend-bundle',
    title: 'A server secret ended up in the frontend build',
    detail: `Found the value of ${leaks.join('; ')}. Anyone can download these files.`,
    fix: 'Find where frontend code reads that variable and move the logic to a Netlify Function. Rotate the secret: treat the old value as public.',
  }]
}

export function lessonMarkdown(issue: BuildIssue, seenAt: Date) {
  return `# ${issue.title}

- Check: \`${issue.id}\` (\`npm run build\`, src/backend/build/buildChecks.ts)
- Last seen: ${seenAt.toISOString()}

## What happened
${issue.detail}

## How to fix
${issue.fix}
`
}

/** Writes (or refreshes) one lesson per issue and returns the file paths. */
export function writeLessons(issues: BuildIssue[], dir: string, seenAt = new Date()) {
  if (issues.length > 0) mkdirSync(dir, { recursive: true })
  return issues.map((issue) => {
    const path = join(dir, `${issue.id}.md`)
    writeFileSync(path, lessonMarkdown(issue, seenAt))
    return path
  })
}
