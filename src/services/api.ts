import type {Message, Session, Topic} from '../types'

const API_URL = import.meta.env.VITE_API_URL

export type HealthStatus = {
  ok: boolean
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const response = await fetch(`${API_URL}/health`)

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }

  return response.json()
}

export async function getTopics(): Promise<Topic[]> {
  const response = await fetch(`${API_URL}/topics`)

  if (!response.ok) {
    throw new Error(`Failed to fetch topics with status ${response.status}`)
  }

  return response.json()
}

export async function createSession(topicId: string): Promise<Session> {
  const response = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({topic_id: topicId}),
  })

  if (!response.ok) {
    throw new Error(`Failed to create session with status ${response.status}`)
  }

  return response.json()
}

export async function sendMessage(sessionId: string, content: string): Promise<Message> {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({content}),
  })

  if (!response.ok) {
    throw new Error(`Failed to send message with status ${response.status}`)
  }

  return response.json()
}
