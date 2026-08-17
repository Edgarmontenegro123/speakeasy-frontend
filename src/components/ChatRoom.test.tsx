import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import ChatRoom from './ChatRoom'
import {useAudioRecorder} from '../hooks/useAudioRecorder'
import {sendAudioMessage, sendMessage} from '../services/api'
import type {Message, Session, Topic} from '../types'

vi.mock('../services/api', () => ({
  sendMessage: vi.fn(),
  sendAudioMessage: vi.fn(),
}))

vi.mock('../hooks/useAudioRecorder', () => ({
  useAudioRecorder: vi.fn(),
}))

class MockAudio {
  static instances: MockAudio[] = []
  src: string
  play = vi.fn()
  pause = vi.fn()
  private listeners: Record<string, () => void> = {}

  constructor(src: string) {
    this.src = src
    MockAudio.instances.push(this)
  }

  addEventListener(event: string, handler: () => void) {
    this.listeners[event] = handler
  }

  emit(event: string) {
    this.listeners[event]?.()
  }
}

const topic: Topic = {
  id: 'topic-1',
  title: 'Ordering coffee',
  description: 'Practise café small talk',
  level: 'A1',
}

const session: Session = {
  id: 'session-1',
  topic_id: 'topic-1',
  status: 'active',
  created_at: '2026-08-16T00:00:00Z',
}

async function sendAndResolveWith(user: ReturnType<typeof userEvent.setup>, reply: Message) {
  let resolveSendMessage: (message: Message) => void = () => {}
  vi.mocked(sendMessage).mockReturnValue(
    new Promise((resolve) => {
      resolveSendMessage = resolve
    }),
  )

  await user.type(screen.getByLabelText('Message'), 'Hello there')
  await user.click(screen.getByRole('button', {name: 'Send'}))
  resolveSendMessage(reply)

  return screen.findByText(reply.content)
}

describe('ChatRoom', () => {
  beforeEach(() => {
    vi.mocked(sendMessage).mockReset()
    vi.mocked(sendAudioMessage).mockReset()
    vi.mocked(useAudioRecorder).mockReturnValue({
      status: 'idle',
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
    })
    MockAudio.instances = []
    vi.stubGlobal('Audio', MockAudio)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the active topic and session ID', () => {
    render(<ChatRoom topic={topic} session={session} onBack={vi.fn()} />)

    expect(screen.getByRole('heading', {name: 'Ordering coffee'})).toBeInTheDocument()
    expect(screen.getByText('Session ID: session-1')).toBeInTheDocument()
  })

  it('calls onBack when the back button is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<ChatRoom topic={topic} session={session} onBack={onBack} />)

    await user.click(screen.getByText('← Back to topics'))

    expect(onBack).toHaveBeenCalledOnce()
  })

  it('sends a message, shows a loading state, then renders the tutor reply', async () => {
    let resolveSendMessage: (message: Message) => void = () => {}
    vi.mocked(sendMessage).mockReturnValue(
      new Promise((resolve) => {
        resolveSendMessage = resolve
      }),
    )

    const user = userEvent.setup()
    render(<ChatRoom topic={topic} session={session} onBack={vi.fn()} />)

    await user.type(screen.getByLabelText('Message'), 'Hello there')
    await user.click(screen.getByRole('button', {name: 'Send'}))

    expect(sendMessage).toHaveBeenCalledWith('session-1', 'Hello there')
    expect(await screen.findByText('Hello there')).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('Tutor is typing…')
    expect(screen.getByLabelText('Message')).toHaveValue('')

    resolveSendMessage({
      id: 'message-1',
      session_id: 'session-1',
      role: 'assistant',
      content: 'Hi! What would you like to order?',
      created_at: '2026-08-16T00:00:01Z',
    })

    expect(await screen.findByText('Hi! What would you like to order?')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('does not show a play button for a tutor reply without audio', async () => {
    const user = userEvent.setup()
    render(<ChatRoom topic={topic} session={session} onBack={vi.fn()} />)

    await sendAndResolveWith(user, {
      id: 'message-1',
      session_id: 'session-1',
      role: 'assistant',
      content: 'No audio here',
      created_at: '2026-08-16T00:00:01Z',
    })

    expect(screen.queryByText('🔊 Listen')).not.toBeInTheDocument()
  })

  it('shows a play button for a tutor reply with audio and toggles playback on click', async () => {
    const user = userEvent.setup()
    render(<ChatRoom topic={topic} session={session} onBack={vi.fn()} />)

    await sendAndResolveWith(user, {
      id: 'message-1',
      session_id: 'session-1',
      role: 'assistant',
      content: 'Hi! What would you like to order?',
      audio_url: 'https://example.com/audio.mp3',
      created_at: '2026-08-16T00:00:01Z',
    })

    const playButton = await screen.findByText('🔊 Listen')
    await user.click(playButton)

    expect(MockAudio.instances).toHaveLength(1)
    expect(MockAudio.instances[0].src).toBe('https://example.com/audio.mp3')
    expect(MockAudio.instances[0].play).toHaveBeenCalledOnce()
    expect(await screen.findByText('⏸️ Playing...')).toBeInTheDocument()

    await user.click(screen.getByText('⏸️ Playing...'))

    expect(MockAudio.instances[0].pause).toHaveBeenCalledOnce()
    expect(await screen.findByText('🔊 Listen')).toBeInTheDocument()
  })

  it('resets to the play state when audio playback ends naturally', async () => {
    const user = userEvent.setup()
    render(<ChatRoom topic={topic} session={session} onBack={vi.fn()} />)

    await sendAndResolveWith(user, {
      id: 'message-1',
      session_id: 'session-1',
      role: 'assistant',
      content: 'Hi! What would you like to order?',
      audio_url: 'https://example.com/audio.mp3',
      created_at: '2026-08-16T00:00:01Z',
    })

    await user.click(await screen.findByText('🔊 Listen'))
    expect(await screen.findByText('⏸️ Playing...')).toBeInTheDocument()

    MockAudio.instances[0].emit('ended')

    expect(await screen.findByText('🔊 Listen')).toBeInTheDocument()
  })

  it('starts recording when the mic button is clicked while idle', async () => {
    const startRecording = vi.fn()
    vi.mocked(useAudioRecorder).mockReturnValue({
      status: 'idle',
      startRecording,
      stopRecording: vi.fn(),
    })

    const user = userEvent.setup()
    render(<ChatRoom topic={topic} session={session} onBack={vi.fn()} />)

    await user.click(screen.getByRole('button', {name: '🎙️ Record'}))

    expect(startRecording).toHaveBeenCalledOnce()
  })

  it('stops recording, uploads the audio, then shows the transcript and the tutor reply', async () => {
    const audioBlob = new Blob(['audio-data'], {type: 'audio/webm'})
    const stopRecording = vi.fn().mockResolvedValue(audioBlob)
    vi.mocked(useAudioRecorder).mockReturnValue({
      status: 'recording',
      startRecording: vi.fn(),
      stopRecording,
    })

    let resolveSendAudioMessage: (result: {transcript: string; reply: Message}) => void = () => {}
    vi.mocked(sendAudioMessage).mockReturnValue(
      new Promise((resolve) => {
        resolveSendAudioMessage = resolve
      }),
    )

    const user = userEvent.setup()
    render(<ChatRoom topic={topic} session={session} onBack={vi.fn()} />)

    await user.click(screen.getByRole('button', {name: '⏹️ Stop'}))

    expect(stopRecording).toHaveBeenCalledOnce()
    expect(await screen.findByText('🎤 Transcribing…')).toBeInTheDocument()
    expect(sendAudioMessage).toHaveBeenCalledWith('session-1', audioBlob)

    resolveSendAudioMessage({
      transcript: 'Can I get a flat white, please?',
      reply: {
        id: 'message-2',
        session_id: 'session-1',
        role: 'assistant',
        content: 'Nice, tell me more!',
        audio_url: 'https://example.com/reply.mp3',
        created_at: '2026-08-17T00:00:01Z',
      },
    })

    expect(await screen.findByText('Can I get a flat white, please?')).toBeInTheDocument()
    expect(screen.queryByText('🎤 Transcribing…')).not.toBeInTheDocument()
    expect(await screen.findByText('Nice, tell me more!')).toBeInTheDocument()
    expect(screen.getByText('🔊 Listen')).toBeInTheDocument()
  })
})
