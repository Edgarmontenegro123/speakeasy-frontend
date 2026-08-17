export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type Topic = {
  id: string
  title: string
  description: string
  level: Level
}

export type SessionStatus = 'active' | 'completed'

export type Session = {
  id: string
  topic_id: string
  status: SessionStatus
  created_at: string
}

export type MessageRole = 'user' | 'assistant'

export type Message = {
  id: string
  session_id: string
  role: MessageRole
  content: string
  audio_url?: string
  created_at: string
}
