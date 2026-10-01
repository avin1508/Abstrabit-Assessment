import jwt from 'jsonwebtoken'
import { getUserById, toSafeUser } from '../services/auth.service.js'
import { HttpError } from '../utils/httpError.js'
import { verifyToken } from '../utils/jwt.js'

export async function authenticate(req, res, next) {
  const [scheme, token, extra] = (req.headers.authorization ?? '').split(' ')
  if (scheme !== 'Bearer' || !token || extra) {
    throw new HttpError(401, 'Authentication required')
  }

  let payload
  try {
    payload = verifyToken(token)
  } catch (error) {
    const message = error instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token'
    throw new HttpError(401, message)
  }

  const user = await getUserById(payload.sub)
  if (!user) {
    throw new HttpError(401, 'User no longer exists')
  }

  req.user = toSafeUser(user)
  next()
}
