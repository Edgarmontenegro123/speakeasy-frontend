import type {Session, Topic} from '../types'

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
    body: JSON.stringify({topicId}),
  })

  if (!response.ok) {
    throw new Error(`Failed to create session with status ${response.status}`)
  }

  return response.json()
}
