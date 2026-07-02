import { config } from './config'
import { initQdrantCollection } from './db/qdrant'
import pool from './db/postgres'

async function main() {
  console.log('🚀 PAC Agent Engine starting...')

  // Test Postgres connection
  await pool.query('SELECT 1')
  console.log('✅ Postgres connected')

  // Init Qdrant collection
  await initQdrantCollection()
  console.log('✅ Qdrant ready')

  console.log(`✅ PAC Agent Engine running on port ${config.app.port}`)
}

main().catch((err) => {
  console.error('❌ Startup failed:', err)
  process.exit(1)
})