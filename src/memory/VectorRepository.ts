import qdrant, { COLLECTION_NAME } from '../db/qdrant'
import { SearchResult, MemoryUnit } from '../types'
import { v4 as uuidv4 } from 'uuid'

export class VectorRepository {

  // ─── UPSERT VECTOR ───────────────────────────────────────
  async upsert(
    memoryId: string,
    vector: number[],
    payload: object
  ): Promise<string> {
    const qdrantId = uuidv4()

    await qdrant.upsert(COLLECTION_NAME, {
      points: [
        {
          id:      qdrantId,
          vector:  vector,
          payload: payload,
        }
      ]
    })

    return qdrantId  // we store this back in Postgres
  }

  // ─── SEARCH BY MEANING ───────────────────────────────────
  async search(
    queryVector: number[],
    userId: string,
    topK: number = 10
  ): Promise<any[]> {
    const results = await qdrant.search(COLLECTION_NAME, {
      vector: queryVector,
      limit:  topK,
      filter: {
        must: [
          {
            key:   'user_id',
            match: { value: userId }  // only search THIS user's memories
          }
        ]
      },
      with_payload: true,
    })

    return results
  }

  // ─── DELETE VECTOR ───────────────────────────────────────
  async delete(qdrantId: string): Promise<void> {
    await qdrant.delete(COLLECTION_NAME, {
      points: [qdrantId]
    })
  }
}