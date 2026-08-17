import {useEffect, useState} from 'react'
import {getHealthStatus} from './services/api'

type BackendStatus = 'checking' | 'connected' | 'disconnected'

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking')

  useEffect(() => {
    let cancelled = false

    getHealthStatus()
      .then(() => {
        if (!cancelled) setBackendStatus('connected')
      })
      .catch(() => {
        if (!cancelled) setBackendStatus('disconnected')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const statusLabel = {
    checking: 'Checking backend…',
    connected: 'Backend connected',
    disconnected: 'Backend disconnected',
  }[backendStatus]

  const statusColour = {
    checking: 'bg-neutral-400',
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
  }[backendStatus]

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 bg-white dark:bg-neutral-950">
      <h1 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100">
        Speakeasy
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400">
        Practice English with real-time voice conversations
      </p>
      <div
        role="status"
        className="mt-4 flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
      >
        <span className={`h-2 w-2 rounded-full ${statusColour}`} />
        {statusLabel}
      </div>
    </main>
  )
}

export default App
