import { MongoClient, type Db } from 'mongodb'
import { mongoEnv } from '../env.ts'

// Created once per function instance and reused across invocations (D-007).
let dbPromise: Promise<Db> | undefined

export function getDb() {
  if (!dbPromise) {
    const env = mongoEnv()
    const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
    dbPromise = client.connect().then((connected) => connected.db(env.MONGODB_DB_NAME))
    dbPromise.catch(() => { dbPromise = undefined })
  }
  return dbPromise
}
