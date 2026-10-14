import type { ReadingPosition, ReadingPositionInput } from '../../shared/schemas/reading.ts'
import { mongoReadingProgressRepository, type ReadingProgressRepository } from '../repositories/readingProgress.ts'
import { mongoUserRepository, type User, type UserRepository } from '../repositories/users.ts'

export function createReadingService(users: UserRepository, positions: ReadingProgressRepository) {
  return {
    /** Null when nothing is saved, or when the user has the setting off (positions are deleted then anyway). */
    async getPosition(userId: string, topicId: string): Promise<ReadingPosition | null> {
      const user = await users.findById(userId)
      if (!user?.resumeReading) return null
      return positions.find(userId, topicId)
    },

    /**
     * Writes only while the setting is on. A beacon sent by another tab just after the user opted out
     * must not bring a deleted position back.
     */
    async savePosition(userId: string, topicId: string, position: ReadingPositionInput): Promise<boolean> {
      const user = await users.findById(userId)
      if (!user?.resumeReading) return false
      await positions.upsert(userId, topicId, position)
      return true
    },

    /** Turning the setting off also deletes every saved position: opting out means we keep nothing. */
    async setResumeReading(userId: string, resumeReading: boolean): Promise<User | null> {
      // Flag first, then delete: once the flag is off, savePosition refuses new writes.
      const user = await users.setResumeReading(userId, resumeReading)
      if (user && !resumeReading) await positions.deleteAllForUser(userId)
      return user
    },
  }
}

export const readingService = createReadingService(mongoUserRepository, mongoReadingProgressRepository)
