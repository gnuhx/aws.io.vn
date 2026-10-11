import { verifyToken } from '@clerk/backend'
import type { Config, Context } from '@netlify/functions'
import { MongoClient, type Collection } from 'mongodb'
import { z } from 'zod'
import { isTrackableProgressItem } from '../../shared/schemas/roadmap-progress.ts'
import { progressDeleteSchema, progressReadParamsSchema, progressUpdateSchema } from '../../shared/schemas/roadmap-progress.ts'

type ProgressRecord = {
  userId: string
  roadmapId: string
  itemId: string
  status: 'in_progress' | 'completed'
  createdAt: Date
  updatedAt: Date
}

const environmentSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_AUTHORIZED_PARTIES: z.string().min(1),
  MONGODB_URI: z.string().min(1).refine((value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://')),
  MONGODB_DB_NAME: z.string().min(1),
})

let mongoClient: MongoClient | undefined
let collectionPromise: Promise<Collection<ProgressRecord>> | undefined

function getCollection() {
  if (!collectionPromise) {
    const env = environmentSchema.parse(process.env)
    mongoClient = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
    collectionPromise = mongoClient.connect().then((client) => {
      const collection = client.db(env.MONGODB_DB_NAME).collection<ProgressRecord>('roadmap_progress')
      return collection.createIndex({ userId: 1, roadmapId: 1, itemId: 1 }, { unique: true, name: 'unique_user_roadmap_item' })
        .then(() => collection)
    })
  }
  return collectionPromise
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function parseRequestBody(request: Request) {
  return request.json().catch(() => null) as Promise<unknown>
}

export default async function progress(request: Request, context: Context) {
  const authorization = request.headers.get('authorization') ?? ''
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!bearer) return json({ error: 'unauthorized' }, 401)

  let env: z.infer<typeof environmentSchema>
  try {
    env = environmentSchema.parse(process.env)
  } catch {
    return json({ error: 'progress service is not configured' }, 503)
  }
  const authorizedParties = env.CLERK_AUTHORIZED_PARTIES.split(',').map((party) => party.trim()).filter(Boolean)
  if (authorizedParties.length === 0) return json({ error: 'progress service is not configured' }, 503)

  let userId: string
  try {
    const verified = await verifyToken(bearer, {
      secretKey: env.CLERK_SECRET_KEY,
      authorizedParties,
    })
    if (typeof verified.sub !== 'string' || !verified.sub) return json({ error: 'unauthorized' }, 401)
    userId = verified.sub
  } catch {
    return json({ error: 'unauthorized' }, 401)
  }

  const rawRoadmapId = context.params.roadmapId ?? ''
  const roadmapResult = progressReadParamsSchema.safeParse({ roadmapId: rawRoadmapId })
  if (!roadmapResult.success) return json({ error: 'invalid roadmap id' }, 400)
  const { roadmapId } = roadmapResult.data

  if (!['GET', 'PUT', 'DELETE'].includes(request.method)) {
    return json({ error: 'method not allowed' }, 405)
  }

  try {
    if (request.method === 'GET') {
      const collection = await getCollection()
      const records = await collection.find({ userId, roadmapId }, { projection: { _id: 0, itemId: 1, status: 1 } }).toArray()
      const statuses = Object.fromEntries(records.map(({ itemId, status }) => [itemId, status]))
      return json({ statuses })
    }

    if (request.method === 'PUT') {
      const body = await parseRequestBody(request)
      const parsed = progressUpdateSchema.safeParse({ ...(body && typeof body === 'object' ? body : {}), roadmapId })
      if (!parsed.success || !isTrackableProgressItem(roadmapId, parsed.data.itemId)) {
        return json({ error: 'invalid progress item or status' }, 400)
      }
      const collection = await getCollection()
      const now = new Date()
      await collection.updateOne(
        { userId, roadmapId, itemId: parsed.data.itemId },
        { $set: { status: parsed.data.status, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true },
      )
      return json({ itemId: parsed.data.itemId, status: parsed.data.status })
    }

    if (request.method === 'DELETE') {
      const body = await parseRequestBody(request)
      const parsed = progressDeleteSchema.safeParse({ ...(body && typeof body === 'object' ? body : {}), roadmapId })
      if (!parsed.success || !isTrackableProgressItem(roadmapId, parsed.data.itemId)) {
        return json({ error: 'invalid progress item' }, 400)
      }
      const collection = await getCollection()
      await collection.deleteOne({ userId, roadmapId, itemId: parsed.data.itemId })
      return json({ itemId: parsed.data.itemId, status: 'not_started' })
    }

    return json({ error: 'method not allowed' }, 405)
  } catch (cause) {
    if (cause instanceof z.ZodError) return json({ error: 'progress service is not configured' }, 503)
    console.error('Progress API request failed', cause)
    return json({ error: 'progress request failed' }, 500)
  }
}

export const config: Config = { path: '/api/progress/:roadmapId' }
