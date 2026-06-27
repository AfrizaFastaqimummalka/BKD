import { Hono } from 'hono'
import { login, me, register } from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'
import { loginRateLimiter } from '../middleware/rateLimiter.js'

const auth = new Hono()

auth.post('/login', loginRateLimiter, login)
auth.post('/register', register)
auth.get('/me', authMiddleware, me)

export default auth