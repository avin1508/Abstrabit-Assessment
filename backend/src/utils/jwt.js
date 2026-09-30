import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const ALGORITHM = 'HS256'
const EXPIRES_IN = '7d'

// The user ID is the token subject.
export function signToken(userId) {
  return jwt.sign({}, env.jwtSecret, {
    algorithm: ALGORITHM,
    expiresIn: EXPIRES_IN,
    subject: String(userId),
  })
}

// Returns the decoded payload; throws TokenExpiredError / JsonWebTokenError when invalid.
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: [ALGORITHM] })
}
