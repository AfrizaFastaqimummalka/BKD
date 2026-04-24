import { Hono } from 'hono'
import { getDokumen, removeDokumen, uploadDokumen } from '../controllers/dokumenController.js'

const dokumen = new Hono()

dokumen.post('/', uploadDokumen)
dokumen.get('/', getDokumen)
dokumen.delete('/:id', removeDokumen)

export default dokumen
