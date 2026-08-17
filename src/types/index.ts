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
  topicId: string
  status: SessionStatus
  createdAt: string
}

export type MessageRole = 'user' | 'assistant'

export type Message = {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  createdAt: string
}
