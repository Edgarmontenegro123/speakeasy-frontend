import {useEffect, useState} from 'react'
import ChatRoom from './components/ChatRoom'
import TopicSelector from './components/TopicSelector'
import {createSession, getHealthStatus, getTopics} from './services/api'
import type {Session, Topic} from './types'

type BackendStatus = 'checking' | 'connected' | 'disconnected'

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking')
  const [topics, setTopics] = useState<Topic[]>([])
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let cancelled = false

    getHealthStatus()
      .then(() => {
        if (!cancelled) setBackendStatus('connected')
      })
      .catch(() => {
        if (!cancelled) setBackendStatus('disconnected')
      })

    getTopics()
      .then((data) => {
        if (!cancelled) setTopics(data)
      })
      .catch(() => {
        if (!cancelled) setTopics([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleSelectTopic = async (topic: Topic) => {
    const newSession = await createSession(topic.id)
    setActiveTopic(topic)
    setSession(newSession)
  }

  const handleBackToTopics = () => {
    setSession(null)
    setActiveTopic(null)
  }

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
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-white p-4 dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100">
          Speakeasy
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Practice English with real-time voice conversations
        </p>
        <div
          role="status"
          className="mt-2 flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
        >
          <span className={`h-2 w-2 rounded-full ${statusColour}`} />
          {statusLabel}
        </div>
      </div>

      {session && activeTopic ? (
        <ChatRoom topic={activeTopic} session={session} onBack={handleBackToTopics} />
      ) : (
        <TopicSelector topics={topics} onSelect={handleSelectTopic} />
      )}
    </main>
  )
}

export default App
