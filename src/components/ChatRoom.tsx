import {useEffect, useRef, useState} from 'react'
import type {FormEvent} from 'react'
import {useAudioRecorder} from '../hooks/useAudioRecorder'
import {sendAudioMessage, sendMessage} from '../services/api'
import type {Message, Session, Topic} from '../types'

type ChatRoomProps = {
  topic: Topic
  session: Session
  onBack: () => void
}

type AudioPlayButtonProps = {
  audioUrl: string
}

function AudioPlayButton({audioUrl}: AudioPlayButtonProps) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const handleClick = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.addEventListener('ended', () => setPlaying(false))
    }

    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-fit text-xs font-medium text-neutral-600 hover:underline dark:text-neutral-300"
    >
      {playing ? '⏸️ Playing...' : '🔊 Listen'}
    </button>
  )
}

function ChatRoom({topic, session, onBack}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const {status: recorderStatus, startRecording, stopRecording} = useAudioRecorder()
  const recording = recorderStatus === 'recording'

  const submitMessage = async (
    userMessage: Message,
    sendReply: () => Promise<{transcript?: string; reply: Message}>,
  ) => {
    setMessages((current) => [...current, userMessage])
    setLoading(true)

    try {
      const {transcript, reply} = await sendReply()

      setMessages((current) => {
        const withTranscript = transcript
          ? current.map((message) =>
              message.id === userMessage.id ? {...message, content: transcript} : message,
            )
          : current

        return [...withTranscript, reply]
      })
    } catch {
      // The tutor reply failed to arrive; the user's message stays in the history so they can retry.
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const content = input.trim()
    if (!content || loading) return

    const userMessage: Message = {
      id: `local-${Date.now()}`,
      session_id: session.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    setInput('')
    await submitMessage(userMessage, async () => ({reply: await sendMessage(session.id, content)}))
  }

  const handleToggleRecording = async () => {
    if (loading) return

    if (recording) {
      const audio = await stopRecording()
      if (!audio) return

      const userMessage: Message = {
        id: `local-${Date.now()}`,
        session_id: session.id,
        role: 'user',
        content: '🎤 Transcribing…',
        created_at: new Date().toISOString(),
      }

      await submitMessage(userMessage, () => sendAudioMessage(session.id, audio))
    } else {
      await startRecording()
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Back to topics
        </button>
        <div className="text-right">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{topic.title}</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Session ID: {session.id}</p>
        </div>
      </div>

      <div className="flex min-h-[16rem] flex-col gap-2 overflow-y-auto rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        {messages.length === 0 && (
          <p className="m-auto text-sm text-neutral-400 dark:text-neutral-500">
            Say hello to start the conversation
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex max-w-[80%] flex-col gap-1 rounded-2xl px-4 py-2 text-sm ${
              message.role === 'user'
                ? 'self-end bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'self-start bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
            }`}
          >
            {message.content}
            {message.role === 'assistant' && message.audio_url && (
              <AudioPlayButton audioUrl={message.audio_url} />
            )}
          </div>
        ))}
        {loading && (
          <div
            role="status"
            className="self-start rounded-2xl bg-neutral-100 px-4 py-2 text-sm text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
          >
            Tutor is typing…
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={loading}
          placeholder="Type your message…"
          aria-label="Message"
          className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-100"
        />
        <button
          type="button"
          onClick={handleToggleRecording}
          disabled={loading}
          className={`rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            recording
              ? 'bg-red-600 text-white'
              : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
          }`}
        >
          {recording ? '⏹️ Stop' : '🎙️ Record'}
        </button>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatRoom
