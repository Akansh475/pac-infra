import OpenAI from 'openai'
import { config } from '../config'

export class EmbeddingService {
  private client = new OpenAI({ apiKey: config.openai.apiKey })

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    return response.data[0].embedding
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    })
    return response.data.map(d => d.embedding)
  }
}