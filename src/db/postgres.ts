import { Pool } from 'pg'
import { config } from '../config'

const pool = new Pool(config.postgres)

pool.on('error', (err) => {
  console.error('Postgres pool error:', err)
})

export default pool