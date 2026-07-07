import dotenv from 'dotenv'

dotenv.config()

import * as readline from 'readline'
import { initNeo4j } from './db/neo4j'
import { initQdrantCollection } from './db/qdrant'
import pool from './db/postgres'
import { MasterAgent } from './agents/MasterAgent'
import { EmailAgent } from './agents/EmailAgent'
import { CalendarAgent } from './agents/CalendarAgent'

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

async function main() {
await initNeo4j()
console.log('✅ Neo4j ready')
  // test hybrid search
console.log('\n🔍 Testing hybrid search...')
const { MemoryEngine } = await import('./memory/MemoryEngine')
const memEngine = new MemoryEngine()

const hybridResults = await memEngine.hybridSearch({
  query:    'interview',
  userId:   TEST_USER_ID,
  keyword:  'interview',
  type:     'task',
})

console.log(`🔍 Hybrid search found ${hybridResults.length} results`)
hybridResults.forEach((r, i) => {
  console.log(`  [${i+1}] ${r.memory.content} (score: ${r.score.toFixed(2)})`)
})
  console.log('🚀 PAC Agent Engine starting...')

  await pool.query('SELECT 1')
  console.log('✅ Postgres connected')

  await initQdrantCollection()
  console.log('✅ Qdrant ready')

  // test EmailAgent
  const emailAgent = new EmailAgent()
  await emailAgent.process({
    from:    'hr@google.com',
    subject: 'Interview Invitation — Software Engineer',
    body:    'Hi Akansh, we would like to schedule a technical interview on July 10th at 3PM IST.',
    date:    new Date().toISOString()
  }, TEST_USER_ID)
  console.log('✅ EmailAgent processed email')

  // test CalendarAgent
  const calendarAgent = new CalendarAgent()
  await calendarAgent.process({
    title:           'System Design Interview — Google',
    description:     'Technical interview for Software Engineer role',
    date:            '2026-07-10T15:00:00+05:30',
    attendees:       ['akansh@gmail.com', 'hr@google.com'],
    location:        'https://meet.google.com/abc-xyz',
    durationMinutes: 60
  }, TEST_USER_ID)
  console.log('✅ CalendarAgent processed event')

  // interactive chat
  const master = new MasterAgent()
  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout
  })

  console.log('\n💬 PAC is ready! Ask me anything (type "exit" to quit)\n')

  const ask = () => {
    rl.question('You: ', async (query) => {
      if (query === 'exit') {
        console.log('Goodbye!')
        rl.close()
        process.exit(0)
      }
      const answer = await master.query(query, TEST_USER_ID)
      console.log(`\n🤖 PAC: ${answer}\n`)
      ask()
    })
  }

  ask()
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})