import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import App from './App'
import {createSession, getHealthStatus, getTopics} from './services/api'
import type {Topic} from './types'

vi.mock('./services/api', () => ({
  getHealthStatus: vi.fn(),
  getTopics: vi.fn(),
  createSession: vi.fn(),
}))

const topics: Topic[] = [
  {id: 'topic-1', title: 'Ordering coffee', description: 'Practise café small talk', level: 'A1'},
]

describe('App', () => {
  beforeEach(() => {
    vi.mocked(getHealthStatus).mockReset()
    vi.mocked(getTopics).mockReset()
    vi.mocked(createSession).mockReset()
    vi.mocked(getTopics).mockResolvedValue(topics)
  })

  it('renders the Speakeasy heading', () => {
    vi.mocked(getHealthStatus).mockResolvedValue({ok: true})
    render(<App />)
    expect(screen.getByRole('heading', {name: 'Speakeasy'})).toBeInTheDocument()
  })

  it('shows a connected badge when the backend health check succeeds', async () => {
    vi.mocked(getHealthStatus).mockResolvedValue({ok: true})
    render(<App />)
    expect(await screen.findByText('Backend connected')).toBeInTheDocument()
  })

  it('shows a disconnected badge when the backend health check fails', async () => {
    vi.mocked(getHealthStatus).mockRejectedValue(new Error('network error'))
    render(<App />)
    expect(await screen.findByText('Backend disconnected')).toBeInTheDocument()
  })

  it('lists the fetched topics for selection', async () => {
    vi.mocked(getHealthStatus).mockResolvedValue({ok: true})
    render(<App />)
    expect(await screen.findByText('Ordering coffee')).toBeInTheDocument()
  })

  it('creates a session and shows the conversation room when a topic is selected', async () => {
    vi.mocked(getHealthStatus).mockResolvedValue({ok: true})
    vi.mocked(createSession).mockResolvedValue({
      id: 'session-1',
      topicId: 'topic-1',
      status: 'active',
      createdAt: '2026-08-16T00:00:00Z',
    })

    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByText('Ordering coffee'))

    expect(createSession).toHaveBeenCalledWith('topic-1')
    expect(await screen.findByText('Session ID: session-1')).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'Ordering coffee'})).toBeInTheDocument()
  })
})
