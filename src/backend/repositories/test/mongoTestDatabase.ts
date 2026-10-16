import { randomUUID } from 'node:crypto'
import { MongoClient, type Db } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import { closeMongo } from '../../clients/mongo.ts'

export type MongoTestDatabase = {
  db: Db
  close: () => Promise<void>
}

/** Starts a local mongod with a unique database and replaces any configured Atlas URI. */
export async function createMongoTestDatabase(): Promise<MongoTestDatabase> {
  const server = await MongoMemoryServer.create()
  const client = new MongoClient(server.getUri(), { serverSelectionTimeoutMS: 5000 })
  const databaseName = `repository_test_${randomUUID().replaceAll('-', '')}`

  process.env.MONGODB_URI = server.getUri()
  process.env.MONGODB_DB_NAME = databaseName

  try {
    await client.connect()
    const db = client.db(databaseName)
    return {
      db,
      close: async () => {
        try {
          await closeMongo()
          await db.dropDatabase()
        } finally {
          await client.close()
          await server.stop()
          delete process.env.MONGODB_URI
          delete process.env.MONGODB_DB_NAME
        }
      },
    }
  } catch (error) {
    await client.close().catch(() => undefined)
    await server.stop()
    delete process.env.MONGODB_URI
    delete process.env.MONGODB_DB_NAME
    throw error
  }
}
