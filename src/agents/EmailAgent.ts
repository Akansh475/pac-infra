import OpenAI from 'openai'
import { config } from '../config'
import { MemoryEngine } from '../memory/MemoryEngine'
import { PriorityEngine } from '../priority/PriorityEngine'
import { CreateMemoryInput } from '../types'

interface RawEmail {
  from:    string
  subject: string
  body:    string
  date:    string
}

export class EmailAgent {
  private llm      = new OpenAI({ apiKey: config.openai.apiKey })
  private memEngine = new MemoryEngine()
  private priority  = new PriorityEngine()

  // ─── MAIN PROCESS ────────────────────────────────────────
  async process(email: RawEmail, userId: string): Promise<void> {
    // Step 1: extract memories from email using LLM
    const extracted = await this.extract(email)

    // Step 2: save each extracted memory
    for (const item of extracted) {
      const importance = this.priority.calculate({
        daysSinceCreated: 0,
        accessCount:      0,
        maxAccessCount:   1,
        emotionalWeight:  item.emotionalWeight || 0.5,
        source:           'gmail'
      })

      const input: CreateMemoryInput = {
        userId,
        type:      item.type,
        content:   item.content,
        category:  item.category,
        source:    'gmail',
        sourceRef: email.from,
        importance,
        eventDate: item.eventDate ? new Date(item.eventDate) : undefined,
        dueDate:   item.dueDate   ? new Date(item.dueDate)   : undefined,
      }

      await this.memEngine.store(input)
    }
  }

  // ─── EXTRACT MEMORIES FROM EMAIL ─────────────────────────
  private async extract(email: RawEmail): Promise<any[]> {
    const prompt = `
You are an AI that extracts memories from emails.
Analyze this email and return a JSON array of memories.

Email:
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Body: ${email.body}

Return ONLY a JSON array. No extra text. Format:
[
  {
    "type": "fact" | "task" | "event" | "project",
    "content": "clear description of the memory",
    "category": "interview" | "deadline" | "report" | "general",
    "emotionalWeight": 0.0 to 1.0,
    "eventDate": "ISO date string or null",
    "dueDate": "ISO date string or null"
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
      // handle both array and object with array inside
      return Array.isArray(parsed) ? parsed : parsed.memories || []
    } catch {
      console.error('EmailAgent: failed to parse LLM response', raw)
      return []
    }
  }
}