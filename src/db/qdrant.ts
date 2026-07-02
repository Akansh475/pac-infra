import { QdrantClient } from '@qdrant/js-client-rest'
import { config } from '../config'

const qdrant = new QdrantClient({
  host: config.qdrant.host,
  port: config.qdrant.port,
})

export const COLLECTION_NAME = 'memories'
export const VECTOR_SIZE     = 1536  // OpenAI text-embedding-3-small

export async function initQdrantCollection(): Promise<void> {
  const collections = await qdrant.getCollections()
  const exists = collections.collections.some(c => c.name === COLLECTION_NAME)

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size:     VECTOR_SIZE,
        distance: 'Cosine',
      }
    })
    console.log(`Qdrant collection '${COLLECTION_NAME}' created`)
  } else {
    console.log(`Qdrant collection '${COLLECTION_NAME}' already exists`)
  }
}

export default qdrant