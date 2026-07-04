import OpenAI from 'openai'
import { config } from './index'

// Groq client (for LLM — chat completions)
export const groqClient = new OpenAI({
  apiKey:  config.groq.apiKey,
  baseURL: config.groq.baseURL,
})

export const LLM_MODEL = config.groq.model