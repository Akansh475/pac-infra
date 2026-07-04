import OpenAI from 'openai'
import { config } from '../config'
import { MemoryEngine } from '../memory/MemoryEngine'
import { PriorityEngine } from '../priority/PriorityEngine'
import { CreateMemoryInput } from '../types'

interface GitHubEvent {
  type:    string   // "PullRequestEvent" | "PushEvent" | "IssuesEvent"
  repo:    string   // "akansh/codereviewerai"
  action:  string   // "opened" | "merged" | "closed"
  title:   string   // PR title or commit message
  date:    string
}

export class ProjectAgent {
  private llm       = new OpenAI({ apiKey: config.openai.apiKey })
  private memEngine = new MemoryEngine()
  private priority  = new PriorityEngine()

  // ─── MAIN PROCESS ────────────────────────────────────────
  async process(event: GitHubEvent, userId: string): Promise<void> {
    // Step 1: extract memory from github event
    const extracted = await this.extract(event)

    // Step 2: save each memory
    for (const item of extracted) {
      const importance = this.priority.calculate({
        daysSinceCreated: 0,
        accessCount:      0,
        maxAccessCount:   1,
        emotionalWeight:  0.5,
        source:           'github'
      })

      const input: CreateMemoryInput = {
        userId,
        type:      item.type,
        content:   item.content,
        category:  item.category || 'general',
        source:    'github',
        sourceRef: event.repo,
        importance,
      }

      await this.memEngine.store(input)
    }
  }

  // ─── EXTRACT MEMORY FROM GITHUB EVENT ────────────────────
  private async extract(event: GitHubEvent): Promise<any[]> {
    const prompt = `
You are an AI that extracts project memories from GitHub events.
Analyze this GitHub event and return a JSON array of memories.

GitHub Event:
Type:   ${event.type}
Repo:   ${event.repo}
Action: ${event.action}
Title:  ${event.title}
Date:   ${event.date}

Return ONLY a JSON array. No extra text. Format:
[
  {
    "type": "fact" | "task" | "project",
    "content": "clear description of what happened",
    "category": "general"
  }
]`

    const response = await this.llm.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })

    const raw = response.choices[0].message.content || '[]'

    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : parsed.memories || []
    } catch {
      console.error('ProjectAgent: failed to parse LLM response', raw)
      return []
    }
  }
}