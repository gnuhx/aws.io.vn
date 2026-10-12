import { beforeEach, describe, expect, it } from 'vitest'
import type { ReadingPositionInput } from '../../shared/schemas/reading.ts'
import type { ReadingProgressRepository } from '../repositories/readingProgress.ts'
import type { User, UserRepository } from '../repositories/users.ts'
import { createReadingService } from './reading.ts'

const userRow = (id: string, resumeReading: boolean): User => ({
  id, email: `${id}@x.io`, name: null, passwordHash: null, googleSub: null, emailVerified: false,
  avatarUrl: null, hobbies: [], techStack: [], bio: '', resumeReading,
})

describe('readingService', () => {
  let users: Map<string, User>
  let rows: Map<string, ReadingPositionInput>
  let service: ReturnType<typeof createReadingService>
  const position = { lessonSlug: 'vpc', sectionId: 'subnets' }

  beforeEach(() => {
    users = new Map([['on', userRow('on', true)], ['off', userRow('off', false)]])
    rows = new Map()
    const userRepo = {
      findById: async (id: string) => users.get(id) ?? null,
      setResumeReading: async (id: string, value: boolean) => {
        const user = users.get(id)
        if (!user) return null
        user.resumeReading = value
        return user
      },
    } as unknown as UserRepository
    const positions: ReadingProgressRepository = {
      find: async (userId, topicId) => {
        const row = rows.get(`${userId}|${topicId}`)
        return row ? { ...row, updatedAt: 'now' } : null
      },
      upsert: async (userId, topicId, value) => { rows.set(`${userId}|${topicId}`, value) },
      deleteAllForUser: async (userId) => {
        const keys = [...rows.keys()].filter((key) => key.startsWith(`${userId}|`))
        keys.forEach((key) => rows.delete(key))
        return keys.length
      },
    }
    service = createReadingService(userRepo, positions)
  })

  it('keeps one position per user and course, latest wins', async () => {
    await service.savePosition('on', 'aws', position)
    await service.savePosition('on', 'aws', { lessonSlug: 'ec2', sectionId: 'pricing' })
    expect(rows.size).toBe(1)
    expect(await service.getPosition('on', 'aws')).toMatchObject({ lessonSlug: 'ec2', sectionId: 'pricing' })
  })

  it('ignores writes and reads while the setting is off', async () => {
    expect(await service.savePosition('off', 'aws', position)).toBe(false)
    expect(rows.size).toBe(0)
    rows.set('off|aws', position)
    expect(await service.getPosition('off', 'aws')).toBeNull()
  })

  it('deletes every position of that user (only) when switched off, and refuses later writes', async () => {
    await service.savePosition('on', 'aws', position)
    await service.savePosition('on', 'MCP', position)
    rows.set('other|aws', position)

    await service.setResumeReading('on', false)
    expect([...rows.keys()]).toEqual(['other|aws'])
    expect(await service.savePosition('on', 'aws', position)).toBe(false)
  })

  it('keeps positions when switched on', async () => {
    rows.set('off|aws', position)
    await service.setResumeReading('off', true)
    expect(rows.size).toBe(1)
  })
})
