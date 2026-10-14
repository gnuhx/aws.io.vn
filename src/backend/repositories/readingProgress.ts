import type { Collection } from 'mongodb'
import { getDb } from '../clients/mongo.ts'
import type { ReadingPosition, ReadingPositionInput } from '../../shared/schemas/reading.ts'

type ReadingRecord = {
  userId: string
  topicId: string
  lessonSlug: string
  sectionId: string
  updatedAt: Date
}

export interface ReadingProgressRepository {
  find(userId: string, topicId: string): Promise<ReadingPosition | null>
  upsert(userId: string, topicId: string, position: ReadingPositionInput): Promise<void>
  deleteAllForUser(userId: string): Promise<number>
}

let collectionPromise: Promise<Collection<ReadingRecord>> | undefined

function reading() {
  if (!collectionPromise) {
    collectionPromise = getDb().then(async (db) => {
      const collection = db.collection<ReadingRecord>('reading_progress')
      // One row per user + course: the latest lesson and section read in it.
      await collection.createIndex({ userId: 1, topicId: 1 }, { unique: true, name: 'unique_user_topic' })
      return collection
    })
    collectionPromise.catch(() => { collectionPromise = undefined })
  }
  return collectionPromise
}

export const mongoReadingProgressRepository: ReadingProgressRepository = {
  async find(userId, topicId) {
    const record = await (await reading()).findOne({ userId, topicId }, { projection: { _id: 0, lessonSlug: 1, sectionId: 1, updatedAt: 1 } })
    return record ? { lessonSlug: record.lessonSlug, sectionId: record.sectionId, updatedAt: record.updatedAt.toISOString() } : null
  },

  async upsert(userId, topicId, { lessonSlug, sectionId }) {
    await (await reading()).updateOne(
      { userId, topicId },
      { $set: { lessonSlug, sectionId, updatedAt: new Date() } },
      { upsert: true },
    )
  },

  async deleteAllForUser(userId) {
    return (await (await reading()).deleteMany({ userId })).deletedCount
  },
}
