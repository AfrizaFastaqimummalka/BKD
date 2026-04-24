import { Hono } from 'hono'
import {
  createUser,
  editUser,
  getUserById,
  getUsers,
  removeUser,
} from '../controllers/usersController.js'

const users = new Hono()

users.get('/', getUsers)
users.get('/:id', getUserById)
users.post('/', createUser)
users.put('/:id', editUser)
users.delete('/:id', removeUser)

export default users
