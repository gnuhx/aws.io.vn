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

/**
 * Saves each item as `completed` unless it already has a record, which stays untouched (so repeats are no-ops).
 * Returns the IDs that were newly saved.
 */
export async function insertCompleted(userId: string, roadmapId: string, itemIds: readonly string[]) {
  const now = new Date()
  const result = await (await progress()).bulkWrite(itemIds.map((itemId) => ({
    updateOne: {
      filter: { userId, roadmapId, itemId },
      update: { $setOnInsert: { status: 'completed' as const, createdAt: now, updatedAt: now } },
      upsert: true,
    },
  })), { ordered: false })
  return Object.keys(result.upsertedIds).map((index) => itemIds[Number(index)])
}

export async function clearStatus(userId: string, roadmapId: string, itemId: string) {
  await (await progress()).deleteOne({ userId, roadmapId, itemId })
}

/** One status change. Append-only: `roadmap_progress` keeps only the latest status, this keeps when it happened. */
export type ActivityRecord = {
  userId: string
  roadmapId: string
  itemId: string
  status: ProgressStatus | 'not_started'
  at: Date
}

let activityPromise: Promise<Collection<ActivityRecord>> | undefined

function activity() {
  if (!activityPromise) {
    activityPromise = getDb().then(async (db) => {
      const collection = db.collection<ActivityRecord>('roadmap_progress_activity')
      await collection.createIndex({ userId: 1, roadmapId: 1, at: -1 }, { name: 'user_roadmap_at' })
      return collection
    })
    activityPromise.catch(() => { activityPromise = undefined })
  }
  return activityPromise
}

export async function recordActivity(userId: string, roadmapId: string, itemId: string, status: ProgressStatus | 'not_started') {
  await (await activity()).insertOne({ userId, roadmapId, itemId, status, at: new Date() })
}

/**
 * Events since `since`, newest first. Records saved before the log existed are backfilled from their `updatedAt`
 * (only for items without a logged event, so later changes aren't counted twice).
 */
export async function listActivity(userId: string, roadmapId: string, since: Date) {
  const events = await (await activity())
    .find({ userId, roadmapId, at: { $gte: since } }, { projection: { _id: 0, itemId: 1, status: 1, at: 1 } })
    .sort({ at: -1 })
    .limit(5000)
    .toArray()
  const logged = new Set(await (await activity()).distinct('itemId', { userId, roadmapId }))
  const legacy = await (await progress())
    .find({ userId, roadmapId, updatedAt: { $gte: since }, itemId: { $nin: [...logged] } }, { projection: { _id: 0, itemId: 1, status: 1, updatedAt: 1 } })
    .toArray()
  return [...events, ...legacy.map(({ itemId, status, updatedAt }) => ({ itemId, status, at: updatedAt }))]
    .sort((left, right) => right.at.getTime() - left.at.getTime())
}
