import { embeddingModel } from '../config/embedding'

export class EmbeddingService {

  async embed(text: string): Promise<number[]> {
    const result = await embeddingModel.embedContent(text)
    return result.embedding.values
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results = await Promise.all(
      texts.map(t => this.embed(t))
    )
    return results
  }
}