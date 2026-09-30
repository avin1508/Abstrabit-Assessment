import { z } from 'zod'

const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email address' }).max(254))

// bcrypt only uses the first 72 bytes of a password.
const password = z
  .string({ error: 'Password is required' })
  .min(8, { error: 'Password must be at least 8 characters' })
  .max(72, { error: 'Password must be at most 72 characters' })

export const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(1, { error: 'Name is required' })
    .max(100, { error: 'Name must be at most 100 characters' }),
  email,
  password,
})

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'Password is required' }).min(1, { error: 'Password is required' }),
})
