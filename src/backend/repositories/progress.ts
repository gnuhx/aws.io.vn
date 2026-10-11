import type { Collection } from 'mongodb'
import { getDb } from '../clients/mongo.ts'
import type { ProgressStatus } from '../../shared/roadmapProgress.ts'

type ProgressRecord = {
  userId: string
  roadmapId: string
  itemId: string
  status: ProgressStatus
  createdAt: Date
  updatedAt: Date
}

let collectionPromise: Promise<Collection<ProgressRecord>> | undefined

function progress() {
  if (!collectionPromise) {
    collectionPromise = getDb().then(async (db) => {
      const collection = db.collection<ProgressRecord>('roadmap_progress')
      await collection.createIndex({ userId: 1, roadmapId: 1, itemId: 1 }, { unique: true, name: 'unique_user_roadmap_item' })
      return collection
    })
    collectionPromise.catch(() => { collectionPromise = undefined })
  }
  return collectionPromise
}

export async function listStatuses(userId: string, roadmapId: string) {
  const records = await (await progress()).find({ userId, roadmapId }, { projection: { _id: 0, itemId: 1, status: 1 } }).toArray()
  return Object.fromEntries(records.map(({ itemId, status }) => [itemId, status])) as Record<string, ProgressStatus>
}

export async function setStatus(userId: string, roadmapId: string, itemId: string, status: ProgressStatus) {
  const now = new Date()
  await (await progress()).updateOne(
    { userId, roadmapId, itemId },
    { $set: { status, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
}

export async function clearStatus(userId: string, roadmapId: string, itemId: string) {
  await (await progress()).deleteOne({ userId, roadmapId, itemId })
}
