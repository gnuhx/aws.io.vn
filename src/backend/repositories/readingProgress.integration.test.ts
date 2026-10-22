import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createMongoTestDatabase, type MongoTestDatabase } from './test/mongoTestDatabase.ts'
import { mongoReadingProgressRepository as repository } from './readingProgress.ts'

let testDatabase: MongoTestDatabase

beforeAll(async () => {
  testDatabase = await createMongoTestDatabase()
})

afterAll(async () => {
  await testDatabase?.close()
})

describe('reading progress repository with MongoDB', () => {
  it('saves and resumes the latest reading position for one user and topic', async () => {
    await repository.upsert('user-a', 'MCP', { lessonSlug: 'module-1-ui', sectionId: 'setup' })
    const first = await repository.find('user-a', 'MCP')
    await new Promise((resolve) => setTimeout(resolve, 15))

    await repository.upsert('user-a', 'MCP', { lessonSlug: 'module-2-server', sectionId: 'tools' })

    const resumed = await repository.find('user-a', 'MCP')
    expect(resumed).toMatchObject({ lessonSlug: 'module-2-server', sectionId: 'tools' })
    expect(Date.parse(resumed?.updatedAt ?? '')).toBeGreaterThan(Date.parse(first?.updatedAt ?? ''))
    expect(await repository.find('user-b', 'MCP')).toBeNull()
  })

  it('enforces one position per user and topic and deletes only that user’s positions', async () => {
    await repository.upsert('user-a', 'MCP', { lessonSlug: 'module-1-ui', sectionId: 'setup' })
    await repository.upsert('user-a', 'aws-saa-c03', { lessonSlug: 'iam', sectionId: 'roles' })
    await repository.upsert('user-b', 'MCP', { lessonSlug: 'module-3-tools', sectionId: 'list-tools' })

    const indexes = await testDatabase.db.collection('reading_progress').indexes()
    expect(indexes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'unique_user_topic', unique: true }),
    ]))

    await expect(repository.deleteAllForUser('user-a')).resolves.toBe(2)
    expect(await repository.find('user-a', 'MCP')).toBeNull()
    expect(await repository.find('user-b', 'MCP')).toMatchObject({ lessonSlug: 'module-3-tools', sectionId: 'list-tools' })
  })
})
