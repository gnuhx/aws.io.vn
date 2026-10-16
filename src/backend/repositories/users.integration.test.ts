import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createMongoTestDatabase, type MongoTestDatabase } from './test/mongoTestDatabase.ts'
import { mongoUserRepository as repository, type NewUser } from './users.ts'

let testDatabase: MongoTestDatabase

beforeAll(async () => {
  testDatabase = await createMongoTestDatabase()
})

afterAll(async () => {
  await testDatabase?.close()
})

const user = (overrides: Partial<NewUser> = {}): NewUser => ({
  email: 'learner@example.com',
  name: 'Learner',
  passwordHash: '$2b$12$hash',
  googleSub: null,
  emailVerified: false,
  avatarUrl: null,
  ...overrides,
})

describe('user repository with MongoDB', () => {
  it('looks users up by email, Google subject, and id', async () => {
    const passwordUser = await repository.create(user())
    const googleUser = await repository.create(user({
      email: 'google@example.com',
      passwordHash: null,
      googleSub: 'google-sub-123',
      emailVerified: true,
    }))

    expect(await repository.findByEmail('learner@example.com')).toMatchObject({ id: passwordUser.id, email: 'learner@example.com' })
    expect(await repository.findByGoogleSub('google-sub-123')).toMatchObject({ id: googleUser.id, email: 'google@example.com' })
    expect(await repository.findById(passwordUser.id)).toMatchObject({ id: passwordUser.id, email: 'learner@example.com' })
    expect(await repository.findByGoogleSub('unknown-sub')).toBeNull()
    expect(await repository.findById('not-an-object-id')).toBeNull()
  })

  it('persists user fields and applies defaults to older or partial documents', async () => {
    const created = await repository.create(user({
      name: null,
      avatarUrl: null,
      passwordHash: null,
      googleSub: null,
    }))
    const document = await testDatabase.db.collection('users').findOne({ email: created.email })

    expect(document).not.toHaveProperty('passwordHash')
    expect(document).not.toHaveProperty('googleSub')
    expect(await repository.findById(created.id)).toMatchObject({
      email: created.email,
      name: null,
      passwordHash: null,
      googleSub: null,
      hobbies: [],
      techStack: [],
      bio: '',
      resumeReading: false,
    })
  })
})
