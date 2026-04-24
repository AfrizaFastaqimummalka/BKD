import { Hono } from 'hono'
import {
  generateAllRekap,
  generateSingleRekap,
  getRekap,
  getRekapByUserPeriode,
} from '../controllers/rekapController.js'

const rekap = new Hono()

rekap.get('/', getRekap)
rekap.get('/:user_id/:periode', getRekapByUserPeriode)
rekap.post('/generate', generateSingleRekap)
rekap.post('/generate-all', generateAllRekap)

export default rekap
