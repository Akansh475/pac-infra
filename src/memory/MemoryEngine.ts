import { MemoryRepository } from './MemoryRepository'
import { VectorRepository } from './VectorRepository'
import { EmbeddingService } from '../rag/EmbeddingService'
import { CreateMemoryInput, MemoryUnit, SearchResult } from '../types'

export class MemoryEngine {
  private memRepo   = new MemoryRepository()
  private vecRepo   = new VectorRepository()
  private embedding = new EmbeddingService()

  // ─── STORE ───────────────────────────────────────────────
  async store(input: CreateMemoryInput): Promise<MemoryUnit> {
    // Step 1: save to Postgres first (source of truth)
    const memory = await this.memRepo.store(input)

    // Step 2: try to index in Qdrant
    try {
      const vector   = await this.embedding.embed(input.content)
      const qdrantId = await this.vecRepo.upsert(
        memory.id,
        vector,
        {
          user_id:    memory.userId,
          memory_id:  memory.id,
          type:       memory.type,
          source:     memory.source,
          importance: memory.importance,
          created_at: memory.createdAt.getTime(),
        }
      )

      // Step 3: save qdrant_id back to Postgres
      await this.memRepo.update(memory.id, { qdrantId } as any)

    } catch (err) {
      // Option C — Postgres save stays, Qdrant failed
      // log and retry later
      console.error(`Qdrant indexing failed for memory ${memory.id}:`, err)
    }

    return memory
  }

  // ─── RETRIEVE BY ID ──────────────────────────────────────
  async retrieve(id: string): Promise<MemoryUnit | null> {
    return await this.memRepo.findById(id)
  }

  // ─── SEARCH BY MEANING ───────────────────────────────────
  async search(
    query: string,
    userId: string,
    topK: number = 10
  ): Promise<SearchResult[]> {
    // Step 1: convert query to vector
    const queryVector = await this.embedding.embed(query)

    // Step 2: search Qdrant for similar memories
    const results = await this.vecRepo.search(queryVector, userId, topK)

    // Step 3: fetch full memory details from Postgres
    const memories = await Promise.all(
      results.map(async (r) => {
        const memory = await this.memRepo.findById(r.payload.memory_id)
        return {
          memory: memory!,
          score:  r.score,
        }
      })
    )

    return memories.filter(m => m.memory !== null)
  }

  // ─── UPDATE ──────────────────────────────────────────────
  async update(
    id: string,
    updates: Partial<MemoryUnit>
  ): Promise<MemoryUnit> {
    return await this.memRepo.update(id, updates)
  }

  // ─── DELETE ──────────────────────────────────────────────
  async delete(id: string): Promise<void> {
    const memory = await this.memRepo.findById(id)
    if (!memory) return

    // soft delete in Postgres
    await this.memRepo.delete(id)

    // hard delete vector from Qdrant
    if ((memory as any).qdrantId) {
      await this.vecRepo.delete((memory as any).qdrantId)
    }
  }
}