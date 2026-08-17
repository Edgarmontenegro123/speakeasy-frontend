import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import App from './App'
import {getHealthStatus} from './services/api'

vi.mock('./services/api', () => ({
  getHealthStatus: vi.fn(),
}))

describe('App', () => {
  beforeEach(() => {
    vi.mocked(getHealthStatus).mockReset()
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
})
