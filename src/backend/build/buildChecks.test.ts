import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkEnv, checkGoogleClient, checkMongoHost, findLeakedSecrets, googleAuthErrorCode, writeLessons, type BuildIssue } from './buildChecks.ts'

const CLIENT_ID = '626358304019-abc123def.apps.googleusercontent.com'
const JWT_SECRET = 'x'.repeat(48)
const MONGODB_URI = 'mongodb+srv://app:s3cr3t-pw-for-tests@cluster0.abcde.mongodb.net/'
const netlifyEnv = {
  NETLIFY: 'true',
  VITE_GOOGLE_CLIENT_ID: CLIENT_ID,
  GOOGLE_CLIENT_ID: CLIENT_ID,
  JWT_SECRET,
  MONGODB_URI,
  MONGODB_DB_NAME: 'aws-io-vn',
}
const ids = (issues: BuildIssue[]) => issues.map((issue) => issue.id)

// Real `authError` values Google put in its error redirect (captured 2026-10-11).
const NOT_FOUND = 'https://accounts.google.com/signin/oauth/error?authError=Cg5pbnZhbGlkX2NsaWVudBIfVGhlIE9BdXRoIGNsaWVudCB3YXMgbm90IGZvdW5kLiCRAw&flowName=GeneralOAuthFlow'
const CLIENT_EXISTS = 'https://accounts.google.com/signin/oauth/error?authError=ChVyZWRpcmVjdF91cmlfbWlzbWF0Y2gSgwIK&flowName=GeneralOAuthFlow'
const googleReplies = (location: string | null) =>
  vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 302, headers: location ? { location } : {} }))

describe('checkEnv', () => {
  it('accepts a complete Netlify configuration', () => {
    expect(checkEnv(netlifyEnv)).toEqual([])
  })

  it('accepts a local build without backend settings or Google', () => {
    expect(checkEnv({})).toEqual([])
  })

  it.each([
    ['trailing space', `${CLIENT_ID} `],
    ['quotes', `"${CLIENT_ID}"`],
    ['client secret pasted instead', 'GOCSPX-abcdefghijklmnop'],
    ['line break', `${CLIENT_ID}\n`],
  ])('rejects a Google Client ID with %s', (_label, value) => {
    expect(ids(checkEnv({ ...netlifyEnv, VITE_GOOGLE_CLIENT_ID: value, GOOGLE_CLIENT_ID: value }))).toEqual(expect.arrayContaining([
      'google-client-id-malformed-vite-google-client-id',
      'google-client-id-malformed-google-client-id',
    ]))
  })

  it('explains the leftover .env.example placeholder', () => {
    const placeholder = 'your-client-id.apps.googleusercontent.com'
    const [issue] = checkEnv({ VITE_GOOGLE_CLIENT_ID: placeholder, GOOGLE_CLIENT_ID: placeholder })
    expect(issue.detail).toMatch(/placeholder.*OAuth client was not found/)
  })

  it('rejects different frontend and backend Client IDs', () => {
    const other = '111-zzz.apps.googleusercontent.com'
    expect(ids(checkEnv({ ...netlifyEnv, GOOGLE_CLIENT_ID: other }))).toContain('google-client-id-mismatch')
  })

  it('rejects a frontend Client ID without the backend one on Netlify', () => {
    expect(ids(checkEnv({ ...netlifyEnv, GOOGLE_CLIENT_ID: undefined }))).toContain('google-client-id-half-configured')
  })

  it.each([
    ['JWT_SECRET', 'jwt-secret-invalid'],
    ['MONGODB_URI', 'mongodb-uri-invalid'],
    ['MONGODB_DB_NAME', 'mongodb-db-name-missing'],
  ])('requires %s on Netlify', (name, id) => {
    expect(ids(checkEnv({ ...netlifyEnv, [name]: undefined }))).toEqual([id])
  })

  it.each([
    'mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/',
    'mongodb+srv://app:secret@replace-cluster.mongodb.net/',
    'mongodb+srv://your-user:pw@cluster0.abcde.mongodb.net/',
  ])('rejects a placeholder MONGODB_URI (%s)', (uri) => {
    const issues = checkEnv({ ...netlifyEnv, MONGODB_URI: uri })
    expect(ids(issues)).toEqual(['mongodb-uri-placeholder'])
    expect(JSON.stringify(issues)).not.toContain(uri)
  })

  it('validates backend settings that are set locally', () => {
    expect(ids(checkEnv({ JWT_SECRET: 'short', MONGODB_URI: 'https://cluster0.example.net' })))
      .toEqual(['jwt-secret-invalid', 'mongodb-uri-invalid'])
  })

  it('rejects secrets exposed through the VITE_ prefix', () => {
    expect(ids(checkEnv({ VITE_JWT_SECRET: JWT_SECRET, VITE_MONGODB_URI: MONGODB_URI }))).toEqual(['secret-with-vite-prefix'])
  })

  it('never puts secret values in messages', () => {
    const issues = checkEnv({ ...netlifyEnv, JWT_SECRET: 'tooshort-secret', VITE_JWT_SECRET: JWT_SECRET, MONGODB_URI: 'postgres://user:pw@host' })
    const text = JSON.stringify(issues)
    for (const value of ['tooshort-secret', JWT_SECRET, 'postgres://user:pw@host']) expect(text).not.toContain(value)
  })
})

describe('Google OAuth client check', () => {
  it('decodes Google error codes', () => {
    expect(googleAuthErrorCode(NOT_FOUND)).toBe('invalid_client')
    expect(googleAuthErrorCode(CLIENT_EXISTS)).toBe('redirect_uri_mismatch')
    expect(googleAuthErrorCode(null)).toBeNull()
  })

  it('fails for a client Google cannot find ("The OAuth client was not found")', async () => {
    const result = await checkGoogleClient(CLIENT_ID, googleReplies(NOT_FOUND))
    expect(result.issue?.id).toBe('google-client-not-found')
    expect(result.issue?.detail).toContain('invalid_client')
  })

  it('passes for an existing client', async () => {
    expect(await checkGoogleClient(CLIENT_ID, googleReplies(CLIENT_EXISTS))).toEqual({ issue: null, warning: null })
  })

  it('only warns when Google cannot be reached or answers unexpectedly', async () => {
    const offline = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'))
    expect((await checkGoogleClient(CLIENT_ID, offline)).issue).toBeNull()
    expect((await checkGoogleClient(CLIENT_ID, offline)).warning).toMatch(/skipped/)
    expect((await checkGoogleClient(CLIENT_ID, googleReplies(null))).issue).toBeNull()
  })

  it('asks Google about exactly the configured Client ID without following redirects', async () => {
    const fetchMock = googleReplies(CLIENT_EXISTS)
    await checkGoogleClient(CLIENT_ID, fetchMock)
    const [url, init] = fetchMock.mock.calls[0]
    expect(new URL(String(url)).searchParams.get('client_id')).toBe(CLIENT_ID)
    expect(init?.redirect).toBe('manual')
  })
})

describe('checkMongoHost', () => {
  const dnsError = (code: string) => Object.assign(new Error(`querySrv ${code}`), { code })

  it('looks up only the SRV record of the cluster host', async () => {
    const resolveSrv = vi.fn().mockResolvedValue([{ name: 'shard-00-00.abcde.mongodb.net', port: 27017 }])
    expect(await checkMongoHost(MONGODB_URI, resolveSrv)).toEqual({ issue: null, warning: null })
    expect(resolveSrv).toHaveBeenCalledWith('_mongodb._tcp.cluster0.abcde.mongodb.net')
  })

  it('fails when the cluster host does not exist (querySrv ENOTFOUND)', async () => {
    const result = await checkMongoHost('mongodb+srv://u:p@replace-cluster.mongodb.net/', vi.fn().mockRejectedValue(dnsError('ENOTFOUND')))
    expect(result.issue?.id).toBe('mongodb-host-not-found')
    expect(JSON.stringify(result)).not.toContain('u:p@')
  })

  it('only warns on other DNS problems and skips non-SRV URIs', async () => {
    expect(await checkMongoHost(MONGODB_URI, vi.fn().mockRejectedValue(dnsError('ETIMEOUT'))))
      .toEqual({ issue: null, warning: 'Could not look up the Atlas host in DNS; skipped.' })
    const resolveSrv = vi.fn()
    expect(await checkMongoHost('mongodb://localhost:27017', resolveSrv)).toEqual({ issue: null, warning: null })
    expect(resolveSrv).not.toHaveBeenCalled()
  })
})

describe('findLeakedSecrets', () => {
  it('finds a server secret value in a built file', () => {
    const issues = findLeakedSecrets(netlifyEnv, [
      { path: 'dist/assets/index.js', content: `const db = "${MONGODB_URI}"` },
      { path: 'dist/index.html', content: '<html></html>' },
    ])
    expect(ids(issues)).toEqual(['secret-in-frontend-bundle'])
    expect(issues[0].detail).toContain('MONGODB_URI in dist/assets/index.js')
    expect(issues[0].detail).not.toContain(MONGODB_URI)
  })

  it('ignores variable names, the public Client ID and unset secrets', () => {
    const content = `MONGODB_URI phải bắt đầu bằng mongodb+srv:// ${CLIENT_ID}`
    expect(findLeakedSecrets(netlifyEnv, [{ path: 'dist/assets/index.js', content }])).toEqual([])
    expect(findLeakedSecrets({}, [{ path: 'dist/assets/index.js', content }])).toEqual([])
  })
})

describe('writeLessons', () => {
  let dir = ''
  afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }) })

  it('writes one .claude/lessons/<issue-id>.md per failure and overwrites it on repeat', () => {
    dir = join(mkdtempSync(join(tmpdir(), 'lessons-')), '.claude/lessons')
    const issue = checkEnv({ ...netlifyEnv, JWT_SECRET: undefined })[0]

    writeLessons([issue], dir, new Date('2026-10-11T00:00:00Z'))
    writeLessons([issue], dir, new Date('2026-10-12T00:00:00Z'))

    expect(readdirSync(dir)).toEqual(['jwt-secret-invalid.md'])
    const lesson = readFileSync(join(dir, 'jwt-secret-invalid.md'), 'utf8')
    expect(lesson).toContain('# JWT_SECRET is missing')
    expect(lesson).toContain('Last seen: 2026-10-12T00:00:00.000Z')
    expect(lesson).toMatch(/## How to fix\nGenerate one/)
  })

  it('writes nothing when there are no issues', () => {
    dir = join(mkdtempSync(join(tmpdir(), 'lessons-')), '.claude/lessons')
    expect(writeLessons([], dir)).toEqual([])
    expect(() => readdirSync(dir)).toThrow()
  })
})
