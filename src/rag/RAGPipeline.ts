import { MemoryEngine } from '../memory/MemoryEngine'
import { EmbeddingService } from './EmbeddingService'
import { MemoryUnit } from '../types'
import { groqClient, LLM_MODEL } from '../config/llm'

export class RAGPipeline {
  private memEngine = new MemoryEngine()
  private embedding = new EmbeddingService()

  // ─── MAIN QUERY ──────────────────────────────────────────
  async query(userQuery: string, userId: string): Promise<string> {
    // Step 1: search relevant memories
    const results = await this.memEngine.search(userQuery, userId, 10)

    if (results.length === 0) {
      return "I don't have enough information to answer that yet. Try connecting more data sources."
    }

    // Step 2: structure memories as context
    const context = this.buildContext(results.map(r => r.memory))

    // Step 3: call Groq LLM with structured context
    const response = await groqClient.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are PAC, a personal AI companion. 
You answer questions based ONLY on the user's memories provided below.
Always cite the source and date of information in your answer.
Be concise and prioritize high importance memories.`
        },
        {
          role: 'user',
          content: `User memories:\n\n${context}\n\nQuestion: ${userQuery}`
        }
      ]
    })

    return response.choices[0].message.content || 'No response generated'
  }

  // ─── BUILD STRUCTURED CONTEXT ────────────────────────────
  private buildContext(memories: MemoryUnit[]): string {
    const sorted = memories.sort((a, b) => b.importance - a.importance)

    return sorted.map((m, index) => `
[MEMORY ${index + 1}]
type:       ${m.type}
source:     ${m.source}
date:       ${m.createdAt.toDateString()}
importance: ${m.importance}
content:    ${m.content}
${m.dueDate ? `due: ${m.dueDate.toDateString()}` : ''}
`).join('\n---\n')
  }
}