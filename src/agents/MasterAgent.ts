import { RAGPipeline } from '../rag/RAGPipeline'
import { PlannerAgent } from './PlannerAgent'

type AgentType = 'planner' | 'rag'

export class MasterAgent {
  private rag     = new RAGPipeline()
  private planner = new PlannerAgent()

  // ─── MAIN ENTRY POINT ────────────────────────────────────
  async query(userQuery: string, userId: string): Promise<string> {
    console.log(`MasterAgent received query: "${userQuery}"`)

    // Step 1: decide which agent to call
    const agent = this.route(userQuery)
    console.log(`MasterAgent routing to: ${agent}`)

    // Step 2: call the right agent
    switch (agent) {
      case 'planner':
        return await this.planner.generateDailyBriefing(userId)

      case 'rag':
      default:
        return await this.rag.query(userQuery, userId)
    }
  }

  // ─── ROUTING LOGIC ───────────────────────────────────────
  private route(query: string): AgentType {
    const q = query.toLowerCase()

    // planner triggers
    const plannerKeywords = [
      'today',
      'briefing',
      'plan',
      'what should i do',
      'morning',
      'daily',
      'prioritize',
      'what should i know'
    ]

    const isPlannerQuery = plannerKeywords.some(k => q.includes(k))

    if (isPlannerQuery) return 'planner'

    // everything else goes to RAG
    return 'rag'
  }
}