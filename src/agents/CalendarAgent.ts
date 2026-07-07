import { MemoryEngine } from '../memory/MemoryEngine'
import { PriorityEngine } from '../priority/PriorityEngine'
import { CreateMemoryInput } from '../types'
import { groqClient, LLM_MODEL } from '../config/llm'

interface CalendarEvent {
  title:           string
  description?:    string
  date:            string
  attendees:       string[]
  location?:       string
  durationMinutes: number
}

export class CalendarAgent {
  private memEngine = new MemoryEngine()
  private priority  = new PriorityEngine()

  async process(event: CalendarEvent, userId: string): Promise<void> {
    console.log('📅 Processing calendar event...')
    const extracted = await this.extract(event)
    console.log(`📅 Extracted ${extracted.length} memories`)

    for (const item of extracted) {
      const importance = this.priority.calculate({
        daysSinceCreated: 0,
        accessCount:      0,
        maxAccessCount:   1,
        emotionalWeight:  item.emotionalWeight || 0.5,
        source:           'calendar'
      })

      const input: CreateMemoryInput = {
        userId,
        type:      item.type,
        content:   item.content,
        category:  item.category,
        source:    'calendar',
        sourceRef: event.title,
        importance,
        eventDate: item.eventDate ? new Date(item.eventDate) : new Date(event.date),
        dueDate:   item.dueDate   ? new Date(item.dueDate)   : undefined,
      }

      await this.memEngine.store(input)
    }
  }

  private async extract(event: CalendarEvent): Promise<any[]> {
    const prompt = `
You are an AI that extracts memories from calendar events.
Analyze this calendar event and return a JSON object with memories array.

Calendar Event:
Title:       ${event.title}
Description: ${event.description || 'None'}
Date:        ${event.date}
Attendees:   ${event.attendees.join(', ')}
Location:    ${event.location || 'None'}
Duration:    ${event.durationMinutes} minutes

Extract these memory types:
1. EVENT memory → the actual scheduled event
2. TASK memory → preparation tasks (e.g. "Prepare for interview")
3. FACT memory → relationship info about attendees

Return ONLY a valid JSON object. No extra text. Format:
{
  "memories": [
    {
      "type": "event" | "task" | "fact",
      "content": "clear description",
      "category": "interview" | "meeting" | "deadline" | "general",
      "emotionalWeight": 0.8,
      "eventDate": "ISO date or null",
      "dueDate": "ISO date or null"
    }
  ]
}`

    console.log('📅 Calling Groq API...')
    const response = await groqClient.chat.completions.create({
      model:    LLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
    })
    console.log('📅 Groq responded!')

    const raw = response.choices[0].message.content || '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()

    try {
      const parsed = JSON.parse(cleaned)
      return Array.isArray(parsed) ? parsed : parsed.memories || []
    } catch {
      console.error('CalendarAgent: failed to parse LLM response', raw)
      return []
    }
  }
}