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
}

export type NewUser = Omit<User, 'id'>

export class DuplicateEmailError extends Error {}

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByGoogleSub(googleSub: string): Promise<User | null>
  /** Throws DuplicateEmailError when the email is taken. */
  create(user: NewUser): Promise<User>
  linkGoogle(id: string, link: { googleSub: string; name: string | null; clearPassword: boolean }): Promise<User | null>
}

type UserDocument = {
  _id: ObjectId
  email: string
  name?: string
  passwordHash?: string
  googleSub?: string
  emailVerified: boolean
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
    }
    try {
      await (await users()).insertOne(doc)
    } catch (cause) {
      if (cause instanceof MongoServerError && cause.code === 11000) throw new DuplicateEmailError()
      throw cause
    }
    return toUser(doc)
  },

  async linkGoogle(id, { googleSub, name, clearPassword }) {
    const doc = await (await users()).findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { googleSub, emailVerified: true, updatedAt: new Date(), ...(name ? { name } : {}) },
        ...(clearPassword ? { $unset: { passwordHash: '' as const } } : {}),
      },
      { returnDocument: 'after' },
    )
    return doc ? toUser(doc) : null
  },
}
