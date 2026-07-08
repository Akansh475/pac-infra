import { EmailAgent } from '../agents/EmailAgent'
import { CalendarAgent } from '../agents/CalendarAgent'
import { ProjectAgent } from '../agents/ProjectAgent'

// ─── INGESTION EVENT TYPE ─────────────────────────────────
export interface IngestionEvent {
  source: 'gmail' | 'calendar' | 'github'
  type:   'email' | 'event' | 'push' | 'pr'
  userId: string
  data:   any
}

export class IngestionPipeline {
  private emailAgent    = new EmailAgent()
  private calendarAgent = new CalendarAgent()
  private projectAgent  = new ProjectAgent()

  // ─── MAIN ENTRY POINT ────────────────────────────────────
  async ingest(event: IngestionEvent): Promise<void> {
    console.log(`📥 Ingesting: source=${event.source} type=${event.type}`)

    // Step 1: clean and normalize
    const normalized = this.normalize(event)

    // Step 2: route to correct agent
    await this.route(normalized)

    console.log(`📥 Ingestion complete: source=${event.source}`)
  }

  // ─── NORMALIZE ───────────────────────────────────────────
  // clean raw data before sending to agent
  private normalize(event: IngestionEvent): IngestionEvent {
    switch (event.source) {
      case 'gmail':
        return {
          ...event,
          data: {
            from:    event.data.from?.trim()    || '',
            subject: event.data.subject?.trim() || '',
            body:    event.data.body?.trim()    || '',
            date:    event.data.date            || new Date().toISOString(),
          }
        }

      case 'calendar':
        return {
          ...event,
          data: {
            title:           event.data.title?.trim()       || '',
            description:     event.data.description?.trim() || '',
            date:            event.data.date                || new Date().toISOString(),
            attendees:       event.data.attendees           || [],
            location:        event.data.location            || '',
            durationMinutes: event.data.durationMinutes     || 60,
          }
        }

      case 'github':
        return {
          ...event,
          data: {
            type:   event.data.type   || '',
            repo:   event.data.repo   || '',
            action: event.data.action || '',
            title:  event.data.title  || '',
            date:   event.data.date   || new Date().toISOString(),
          }
        }

      default:
        return event
    }
  }

  // ─── ROUTE TO CORRECT AGENT ──────────────────────────────
  private async route(event: IngestionEvent): Promise<void> {
    switch (event.source) {
      case 'gmail':
        await this.emailAgent.process(event.data, event.userId)
        break

      case 'calendar':
        await this.calendarAgent.process(event.data, event.userId)
        break

      case 'github':
        await this.projectAgent.process(event.data, event.userId)
        break

      default:
        console.error(`Unknown source: ${event.source}`)
    }
  }
}