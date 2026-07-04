import OpenAI from 'openai'
import { config } from '../config'
import { MemoryEngine } from '../memory/MemoryEngine'

export class PlannerAgent {
  private llm       = new OpenAI({ apiKey: config.openai.apiKey })
  private memEngine = new MemoryEngine()

  // ─── GENERATE DAILY BRIEFING ─────────────────────────────
  async generateDailyBriefing(userId: string): Promise<string> {
    // Step 1: search for today's most important memories
    const results = await this.memEngine.search(
      'important tasks events deadlines interviews today',
      userId,
      15
    )

    if (results.length === 0) {
      return 'No important updates for today. You are all caught up!'
    }

    // Step 2: sort by importance
    const sorted = results
      .sort((a, b) => b.memory.importance - a.memory.importance)

    // Step 3: build context
    const context = sorted.map((r, i) => `
[${i + 1}] type: ${r.memory.type} | importance: ${r.memory.importance.toFixed(2)}
content: ${r.memory.content}
${r.memory.dueDate ? `due: ${r.memory.dueDate.toDateString()}` : ''}
`).join('\n')

    // Step 4: generate briefing using LLM
    const response = await this.llm.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are PAC, a personal AI companion.
Generate a clear morning briefing for the user.
Structure it as:
🚨 ALERTS    → urgent items (importance > 0.8)
✅ TASKS     → things to do today
📅 EVENTS    → meetings and scheduled things
💡 INSIGHTS  → patterns or things to be aware of

Be concise. Max 200 words.`
        },
        {
          role: 'user',
          content: `My memories for today:\n\n${context}\n\nGenerate my morning briefing.`
        }
      ]
    })

    return response.choices[0].message.content || 'Could not generate briefing.'
  }
}