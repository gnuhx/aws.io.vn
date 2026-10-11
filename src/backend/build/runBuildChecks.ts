// Usage (see package.json): node --env-file-if-exists=.env src/backend/build/runBuildChecks.ts <env|bundle>
// `env` runs before `vite build`, `bundle` after it. On failure each issue is recorded in
// .claude/lessons/<issue-id>.md and the build exits 1.
import { readdirSync, readFileSync } from 'node:fs'
import { resolveSrv } from 'node:dns/promises'
import { join } from 'node:path'
import { checkEnv, checkGoogleClient, checkMongoHost, findLeakedSecrets, writeLessons, type BuildIssue } from './buildChecks.ts'

const root = join(import.meta.dirname, '../../..')
const stage = process.argv[2]
const issues: BuildIssue[] = []

if (stage === 'env') {
  issues.push(...checkEnv(process.env))
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID
  if (clientId && issues.length === 0 && process.env.SKIP_GOOGLE_CLIENT_CHECK !== '1' && process.env.SKIP_NETWORK_CHECKS !== '1') {
    const { issue, warning } = await checkGoogleClient(clientId)
    if (issue) issues.push(issue)
    if (warning) console.warn(`build check: ${warning}`)
  }
  const mongoUri = process.env.MONGODB_URI
  if (mongoUri && issues.length === 0 && process.env.SKIP_NETWORK_CHECKS !== '1') {
    const { issue, warning } = await checkMongoHost(mongoUri, resolveSrv)
    if (issue) issues.push(issue)
    if (warning) console.warn(`build check: ${warning}`)
  }
} else if (stage === 'bundle') {
  const dist = join(root, 'dist')
  const files = readdirSync(dist, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(js|html|css|json|map|txt)$/.test(entry.name))
    .map((entry) => {
      const path = join(entry.parentPath, entry.name)
      return { path: path.slice(root.length + 1), content: readFileSync(path, 'utf8') }
    })
  issues.push(...findLeakedSecrets(process.env, files))
} else {
  console.error('usage: runBuildChecks.ts <env|bundle>')
  process.exit(2)
}

if (issues.length === 0) {
  console.log(`build check (${stage}): ok`)
} else {
  writeLessons(issues, join(root, '.claude/lessons'))
  for (const issue of issues) {
    console.error(`build check (${stage}) failed: ${issue.title}\n  ${issue.fix.replace(/\n/g, '\n  ')}\n  → .claude/lessons/${issue.id}.md`)
  }
  process.exit(1)
}
