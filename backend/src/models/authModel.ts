import { query } from '../db/client.js'

export type AuthUser = {
  id: number
  nama: string
  email: string
  role: string
  password: string
}

export function findUserByEmail(email: string) {
  return query<AuthUser>(
    `SELECT id, nama, email, role, password FROM users WHERE email = $1`,
    [email]
  )
}

export function findAuthUserById(id: number) {
  return query<{ id: number; nama: string; email: string; role: string }>(
    `SELECT id, nama, email, role FROM users WHERE id = $1`,
    [id]
  )
}

export function checkExistingEmail(email: string) {
  return query<{ id: number }>(`SELECT id FROM users WHERE email = $1`, [email])
}

export function createUser(
  nama: string,
  email: string,
  hashedPassword: string,
  role: string
) {
  return query<{ id: number; nama: string; email: string; role: string }>(
    `INSERT INTO users (nama, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nama, email, role`,
    [nama, email, hashedPassword, role]
  )
}
