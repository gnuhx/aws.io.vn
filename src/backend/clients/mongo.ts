import { MongoClient, type Db } from 'mongodb'
import { mongoEnv } from '../env.ts'

// Created once per function instance and reused across invocations (D-007).
let dbPromise: Promise<Db> | undefined
let mongoClient: MongoClient | undefined

export function getDb() {
  if (!dbPromise) {
    const env = mongoEnv()
    const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
    mongoClient = client
    dbPromise = client.connect().then((connected) => connected.db(env.MONGODB_DB_NAME))
    dbPromise.catch(() => {
      if (mongoClient === client) {
        mongoClient = undefined
        dbPromise = undefined
      }
      void client.close().catch(() => undefined)
    })
  }
  return dbPromise
}

/** Close and clear the cached client, primarily for clean test teardown. */
export async function closeMongo() {
  const client = mongoClient
  mongoClient = undefined
  dbPromise = undefined
  if (client) await client.close()
}
