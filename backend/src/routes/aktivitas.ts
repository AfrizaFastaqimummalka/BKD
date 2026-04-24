import { Hono } from 'hono'
import {
  createAktivitas,
  deleteAktivitas,
  editAktivitas,
  getAktivitas,
  getAktivitasById,
  submitAktivitasDraft,
} from '../controllers/aktivitasController.js'

const aktivitas = new Hono()

aktivitas.get('/', getAktivitas)
aktivitas.get('/:id', getAktivitasById)
aktivitas.post('/', createAktivitas)
aktivitas.put('/:id', editAktivitas)
aktivitas.delete('/:id', deleteAktivitas)
aktivitas.patch('/:id/submit', submitAktivitasDraft)

export default aktivitas
