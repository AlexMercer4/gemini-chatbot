import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Conversation {
  id: string
  created_at: string
  user_session_id?: string
  total_messages?: number
  total_tokens?: number
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  token_count: number
  created_at: string
}

export interface ChatStats {
  total_conversations: number
  total_messages: number
  total_tokens: number
  avg_messages_per_conversation: number
  conversations_today: number
  tokens_today: number
}