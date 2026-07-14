import { RAGPipeline } from '../rag/RAGPipeline'
import { PlannerAgent } from './PlannerAgent'
import { RelationshipAgent } from './RelationshipAgent'
import { ExperienceAgent } from './ExperienceAgent'
import { MemoryOptimizer } from '../memory/MemoryOptimizer'

type AgentType = 'planner' | 'rag' | 'relationship' | 'experience' | 'document' | 'delivery' | 'optimize'

export class MasterAgent {
  private rag       = new RAGPipeline()
  private planner   = new PlannerAgent()
  private relationship = new RelationshipAgent()
  private experience   = new ExperienceAgent()
  private optimizer    = new MemoryOptimizer()

  async query(userQuery: string, userId: string): Promise<string> {
    console.log(`MasterAgent received query: "${userQuery}"`)

    const agent = this.route(userQuery)
    console.log(`MasterAgent routing to: ${agent}`)

    switch (agent) {
      case 'planner':
        return await this.planner.generateDailyBriefing(userId)

      case 'relationship':
        const name = this.extractName(userQuery)
        return await this.relationship.buildProfile(name, userId)

      case 'experience':
        return await this.experience.analyzePatterns(userId)

      case 'optimize':
        await this.optimizer.optimize(userId)
        return '🔧 Memory optimization complete! Duplicates removed, old memories forgotten and summarized.'

      case 'document':
      case 'delivery':
      case 'rag':
      default:
        return await this.rag.query(userQuery, userId)
    }
  }

  private route(query: string): AgentType {
    const q = query.toLowerCase()

    const plannerKeywords = [
      'today', 'briefing', 'plan', 'what should i do',
      'morning', 'daily', 'prioritize', 'what should i know'
    ]

    const relationshipKeywords = [
      'who is',
      'what do i know about',
      'relationship with',
      'what do i owe',
      'committed to'
    ]

    const experienceKeywords = [
      'pattern', 'habit', 'behavior', 'tendency',
      'analyze me', 'what do i usually', 'my style',
      'insights about me', 'how do i work'
    ]

    const documentKeywords = [
      'my resume', 'my skills', 'my experience',
      'my projects', 'what did i build',
      'my background', 'tell me about my'
    ]

    const deliveryKeywords = [
      'delivery', 'order', 'package', 'shipping',
      'arriving', 'keyboard', 'amazon', 'flipkart',
      'track', 'shipment', 'bill', 'due'
    ]

    const optimizeKeywords = [
      'optimize memory', 'clean memory', 'remove duplicates',
      'forget old', 'summarize memories', 'cleanup'
    ]

    if (plannerKeywords.some(k => q.includes(k)))      return 'planner'
    if (relationshipKeywords.some(k => q.includes(k))) return 'relationship'
    if (experienceKeywords.some(k => q.includes(k)))   return 'experience'
    if (documentKeywords.some(k => q.includes(k)))     return 'document'
    if (deliveryKeywords.some(k => q.includes(k)))     return 'delivery'
    if (optimizeKeywords.some(k => q.includes(k)))     return 'optimize'

    return 'rag'
  }

  private extractName(query: string): string {
    const q = query.toLowerCase()
    const cleaned = q
      .replace('who is', '')
      .replace('what do i know about', '')
      .replace('relationship with', '')
      .replace('what do i owe', '')
      .replace('committed to', '')
      .trim()
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
}