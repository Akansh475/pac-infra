import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from './index'

const genAI = new GoogleGenerativeAI(config.gemini.apiKey)

export const embeddingModel = genAI.getGenerativeModel({
  model: 'text-embedding-004'
})

export const EMBEDDING_SIZE = 768  // Gemini text-embedding-004 dimension