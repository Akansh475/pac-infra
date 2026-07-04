import { config } from './config'
import { initQdrantCollection } from './db/qdrant'
import pool from './db/postgres'
import { MasterAgent } from './agents/MasterAgent'
import { EmailAgent } from './agents/EmailAgent'

async function main() {
  console.log('🚀 PAC Agent Engine starting...')

  // Test DB connections
  await pool.query('SELECT 1')
  console.log('✅ Postgres connected')

  await initQdrantCollection()
  console.log('✅ Qdrant ready')

  // Test EmailAgent with fake email
  const emailAgent = new EmailAgent()
  await emailAgent.process({
    from:    'hr@google.com',
    subject: 'Interview Invitation — Software Engineer',
    body:    'Hi Akansh, we would like to schedule a technical interview on July 10th at 3PM IST. Please confirm your availability.',
    date:    new Date().toISOString()
  }, 'test-user-123')
  console.log('✅ EmailAgent processed email')

  // Test MasterAgent query
  const master = new MasterAgent()
  const answer = await master.query('Did I get any interview calls?', 'test-user-123')
  console.log('\n🤖 PAC Answer:', answer)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})