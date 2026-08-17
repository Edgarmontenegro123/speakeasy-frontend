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
