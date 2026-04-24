import { Hono } from 'hono'
import { login, me, register } from '../controllers/authController.js'

const auth = new Hono()

auth.post('/login', login)
auth.post('/register', register)
auth.get('/me', me)

export default auth