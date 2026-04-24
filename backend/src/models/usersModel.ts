import { query } from '../db/client.js'

export function listUsers() {
  return query(`SELECT id, nama, email, role, created_at FROM users ORDER BY id`)
}

export function findUserById(id: number) {
  return query(
    `SELECT id, nama, email, role, created_at FROM users WHERE id = $1`,
    [id]
  )
}

export function insertUser(
  nama: string,
  email: string,
  hashedPassword: string,
  role: string
) {
  return query(
    `INSERT INTO users (nama, email, password, role) 
     VALUES ($1, $2, $3, $4) RETURNING id, nama, email, role`,
    [nama, email, hashedPassword, role]
  )
}

export function updateUser(
  id: number,
  nama: string | null,
  email: string | null,
  role: string | null
) {
  return query(
    `UPDATE users SET
      nama  = COALESCE($1, nama),
      email = COALESCE($2, email),
      role  = COALESCE($3::user_role, role)
     WHERE id = $4 RETURNING *`,
    [nama, email, role, id]
  )
}

export function deleteUser(id: number) {
  return query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id])
}
