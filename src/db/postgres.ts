import { Pool } from 'pg'

const pool = new Pool({
  host:     'localhost',
  port:     5432,
  database: 'pac_db',
  user:     'pac_user',
  password: 'password',
})

pool.on('error', (err) => {
  console.error('Postgres pool error:', err)
})

export default pool