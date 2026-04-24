import { Hono } from 'hono'
import {
  getVerifikasiHistory,
  getVerifikasiList,
  processVerifikasi,
} from '../controllers/verifikasiController.js'

const verifikasi = new Hono()

verifikasi.get('/', getVerifikasiList)
verifikasi.get('/history/:aktivitas_id', getVerifikasiHistory)
verifikasi.post('/:aktivitas_id', processVerifikasi)

export default verifikasi
