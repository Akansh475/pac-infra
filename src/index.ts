import dotenv from 'dotenv'
dotenv.config()

import { config } from './config'
import { initQdrantCollection } from './db/qdrant'
import pool from './db/postgres'
import { MasterAgent } from './agents/MasterAgent'
import { EmailAgent } from './agents/EmailAgent'


const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

async function main() {
  console.log('🚀 PAC Agent Engine starting...')

  await pool.query('SELECT 1')
  console.log('✅ Postgres connected')

  await initQdrantCollection()
  console.log('✅ Qdrant ready')

  console.log('📧 Processing email...')
  const emailAgent = new EmailAgent()
  await emailAgent.process({
    from:    'hr@google.com',
    subject: 'Interview Invitation — Software Engineer',
    body:    'Hi Akansh, we would like to schedule a technical interview on July 10th at 3PM IST. Please confirm your availability.',
    date:    new Date().toISOString()
  }, TEST_USER_ID)
  console.log('✅ EmailAgent processed email')

  console.log('🤖 Querying MasterAgent...')
  const master = new MasterAgent()
  const answer = await master.query('Did I get any interview calls?', TEST_USER_ID)
  console.log('\n🤖 PAC Answer:', answer)
}
main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})