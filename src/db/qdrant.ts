import axios from 'axios'

const QDRANT_URL = 'http://localhost:6333'

export const COLLECTION_NAME = 'memories'
export const VECTOR_SIZE = 384

export async function initQdrantCollection(): Promise<void> {
  const response = await axios.get(`${QDRANT_URL}/collections/${COLLECTION_NAME}`)
    .catch(() => null)

  if (!response) {
    await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
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

export async function upsertVector(
  id: string,
  vector: number[],
  payload: object
): Promise<void> {
  await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
    points: [{ id, vector, payload }]
  })
}

export async function searchVectors(
  vector: number[],
  userId: string,
  topK: number
): Promise<any[]> {
  const response = await axios.post(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`,
    {
      vector,
      limit:        topK,
      filter:       { must: [{ key: 'user_id', match: { value: userId } }] },
      with_payload: true,
    }
  )
  return response.data.result
}

export async function deleteVector(id: string): Promise<void> {
  await axios.post(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points/delete`,
    { points: [id] }
  )
}