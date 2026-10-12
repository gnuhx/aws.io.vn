import { MongoServerError, ObjectId, type Collection } from 'mongodb'
import { getDb } from '../clients/mongo.ts'

export type User = {
  id: string
  email: string
  name: string | null
  passwordHash: string | null
  googleSub: string | null
  /** True once an identity provider (Google) has proven the user owns the email. */
  emailVerified: boolean
  avatarUrl: string | null
  hobbies: string[]
  techStack: string[]
  bio: string
}

export type NewUser = Pick<User, 'email' | 'name' | 'passwordHash' | 'googleSub' | 'emailVerified' | 'avatarUrl'>
export type ProfileFields = Pick<User, 'name' | 'hobbies' | 'techStack' | 'bio'>

export class DuplicateEmailError extends Error {}

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByGoogleSub(googleSub: string): Promise<User | null>
  /** Throws DuplicateEmailError when the email is taken. */
  create(user: NewUser): Promise<User>
  linkGoogle(id: string, link: { googleSub: string; name: string | null; avatarUrl: string | null; clearPassword: boolean }): Promise<User | null>
  setAvatar(id: string, avatarUrl: string | null): Promise<void>
  updateProfile(id: string, profile: ProfileFields): Promise<User | null>
  setPasswordHash(id: string, passwordHash: string): Promise<void>
}

type UserDocument = {
  _id: ObjectId
  email: string
  name?: string
  passwordHash?: string
  googleSub?: string
  emailVerified: boolean
  avatarUrl?: string
  hobbies?: string[]
  techStack?: string[]
  bio?: string
  createdAt: Date
  updatedAt: Date
}

const toUser = (doc: UserDocument): User => ({
  id: doc._id.toHexString(),
  email: doc.email,
  name: doc.name ?? null,
  passwordHash: doc.passwordHash ?? null,
  googleSub: doc.googleSub ?? null,
  emailVerified: doc.emailVerified,
  avatarUrl: doc.avatarUrl ?? null,
  hobbies: doc.hobbies ?? [],
  techStack: doc.techStack ?? [],
  bio: doc.bio ?? '',
})

let collectionPromise: Promise<Collection<UserDocument>> | undefined

function users() {
  if (!collectionPromise) {
    collectionPromise = getDb().then(async (db) => {
      const collection = db.collection<UserDocument>('users')
      await collection.createIndexes([
        { key: { email: 1 }, name: 'unique_email', unique: true },
        // Partial, not sparse: password-only users have no googleSub field at all.
        { key: { googleSub: 1 }, name: 'unique_google_sub', unique: true, partialFilterExpression: { googleSub: { $type: 'string' } } },
      ])
      return collection
    })
    collectionPromise.catch(() => { collectionPromise = undefined })
  }
  return collectionPromise
}

export const mongoUserRepository: UserRepository = {
  async findById(id) {
    if (!ObjectId.isValid(id)) return null
    const doc = await (await users()).findOne({ _id: new ObjectId(id) })
    return doc ? toUser(doc) : null
  },

  async findByEmail(email) {
    const doc = await (await users()).findOne({ email })
    return doc ? toUser(doc) : null
  },

  async findByGoogleSub(googleSub) {
    const doc = await (await users()).findOne({ googleSub })
    return doc ? toUser(doc) : null
  },

  async create(user) {
    const now = new Date()
    const doc: UserDocument = {
      _id: new ObjectId(),
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: now,
      updatedAt: now,
      ...(user.name ? { name: user.name } : {}),
      ...(user.passwordHash ? { passwordHash: user.passwordHash } : {}),
      ...(user.googleSub ? { googleSub: user.googleSub } : {}),
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    }
    try {
      await (await users()).insertOne(doc)
    } catch (cause) {
      if (cause instanceof MongoServerError && cause.code === 11000) throw new DuplicateEmailError()
      throw cause
    }
    return toUser(doc)
  },

  async linkGoogle(id, { googleSub, name, avatarUrl, clearPassword }) {
    const doc = await (await users()).findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { googleSub, emailVerified: true, updatedAt: new Date(), ...(name ? { name } : {}), ...(avatarUrl ? { avatarUrl } : {}) },
        ...(clearPassword ? { $unset: { passwordHash: '' as const } } : {}),
      },
      { returnDocument: 'after' },
    )
    return doc ? toUser(doc) : null
  },
  async setAvatar(id, avatarUrl) {
    await (await users()).updateOne(
      { _id: new ObjectId(id) },
      avatarUrl ? { $set: { avatarUrl, updatedAt: new Date() } } : { $unset: { avatarUrl: '' }, $set: { updatedAt: new Date() } },
    )
  },

  async updateProfile(id, { name, hobbies, techStack, bio }) {
    if (!ObjectId.isValid(id)) return null
    const doc = await (await users()).findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { hobbies, techStack, bio, updatedAt: new Date(), ...(name ? { name } : {}) },
        ...(name ? {} : { $unset: { name: '' as const } }),
      },
      { returnDocument: 'after' },
    )
    return doc ? toUser(doc) : null
  },

  async setPasswordHash(id, passwordHash) {
    await (await users()).updateOne({ _id: new ObjectId(id) }, { $set: { passwordHash, updatedAt: new Date() } })
  },
}
