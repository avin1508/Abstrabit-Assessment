import mongoose from 'mongoose'
import { User, Workspace } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'
import { signToken } from '../utils/jwt.js'
import { comparePassword, hashPassword } from '../utils/password.js'

const FIRST_WORKSPACE_NAME = 'My Workspace'
const INVALID_CREDENTIALS = 'Invalid email or password'

// Compared against when the email is unknown, so failed logins take the same time either way.
const DUMMY_HASH = await hashPassword('timing-safe-placeholder')

export function toSafeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  }
}

// Creates the user and their first workspace atomically.
export async function register({ name, email, password }) {
  if (await User.exists({ email })) {
    throw new HttpError(409, 'An account with this email already exists')
  }

  const passwordHash = await hashPassword(password)

  const user = await mongoose.connection.transaction(async (session) => {
    const [createdUser] = await User.create([{ name, email, passwordHash }], { session })
    await Workspace.create([{ name: FIRST_WORKSPACE_NAME, ownerId: createdUser._id }], { session })
    return createdUser
  })

  return { user: toSafeUser(user), token: signToken(user._id) }
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash')
  const valid = await comparePassword(password, user?.passwordHash ?? DUMMY_HASH)

  if (!user || !valid) {
    throw new HttpError(401, INVALID_CREDENTIALS)
  }

  return { user: toSafeUser(user), token: signToken(user._id) }
}

export async function getUserById(userId) {
  if (!mongoose.isValidObjectId(userId)) return null
  return User.findById(userId)
}
