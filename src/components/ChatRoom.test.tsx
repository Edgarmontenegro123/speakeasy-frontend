import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import ChatRoom from './ChatRoom'
import {sendMessage} from '../services/api'
import type {Message, Session, Topic} from '../types'

vi.mock('../services/api', () => ({
  sendMessage: vi.fn(),
}))

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

describe('ChatRoom', () => {
  beforeEach(() => {
    vi.mocked(sendMessage).mockReset()
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
})
