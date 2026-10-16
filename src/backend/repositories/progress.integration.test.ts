import { MongoServerError } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createMongoTestDatabase, type MongoTestDatabase } from './test/mongoTestDatabase.ts'
import * as repository from './progress.ts'

let testDatabase: MongoTestDatabase

beforeAll(async () => {
  testDatabase = await createMongoTestDatabase()
})

afterAll(async () => {
  await testDatabase?.close()
})

describe('progress repository with MongoDB', () => {
  it('creates a unique user/roadmap/item index', async () => {
    await repository.setStatus('user-a', 'MCP', 'MCP:item-0001', 'in_progress')

    const duplicateInsert = testDatabase.db.collection('roadmap_progress').insertOne({
      userId: 'user-a',
      roadmapId: 'MCP',
      itemId: 'MCP:item-0001',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await expect(duplicateInsert).rejects.toBeInstanceOf(MongoServerError)
    await expect(duplicateInsert).rejects.toMatchObject({ code: 11000 })

    const indexes = await testDatabase.db.collection('roadmap_progress').indexes()
    expect(indexes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'unique_user_roadmap_item', unique: true }),
    ]))
  })

  it('upserts a status without replacing createdAt and lists only the requested user', async () => {
    await repository.setStatus('user-a', 'MCP', 'MCP:item-0001', 'in_progress')
    await repository.setStatus('user-b', 'MCP', 'MCP:item-0001', 'completed')
    const first = await testDatabase.db.collection('roadmap_progress').findOne({ userId: 'user-a', itemId: 'MCP:item-0001' })
    await new Promise((resolve) => setTimeout(resolve, 15))

    await repository.setStatus('user-a', 'MCP', 'MCP:item-0001', 'completed')
    const updated = await testDatabase.db.collection('roadmap_progress').findOne({ userId: 'user-a', itemId: 'MCP:item-0001' })

    expect(updated?.createdAt).toEqual(first?.createdAt)
    expect(updated?.updatedAt.getTime()).toBeGreaterThan(first?.updatedAt.getTime() ?? 0)
    expect(updated?.status).toBe('completed')
    expect(await repository.listStatuses('user-a', 'MCP')).toEqual({ 'MCP:item-0001': 'completed' })
    expect(await repository.listStatuses('user-b', 'MCP')).toEqual({ 'MCP:item-0001': 'completed' })
  })

  it('clears only the selected status', async () => {
    await repository.setStatus('user-a', 'aws-saa-c03', 'aws-saa-c03:item-0001', 'completed')
    await repository.setStatus('user-a', 'aws-saa-c03', 'aws-saa-c03:item-0002', 'in_progress')
    await repository.setStatus('user-b', 'aws-saa-c03', 'aws-saa-c03:item-0001', 'completed')

    await repository.clearStatus('user-a', 'aws-saa-c03', 'aws-saa-c03:item-0001')

    expect(await repository.listStatuses('user-a', 'aws-saa-c03')).toEqual({ 'aws-saa-c03:item-0002': 'in_progress' })
    expect(await repository.listStatuses('user-b', 'aws-saa-c03')).toEqual({ 'aws-saa-c03:item-0001': 'completed' })
  })
})
