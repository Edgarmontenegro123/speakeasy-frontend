import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'
import TopicSelector from './TopicSelector'
import type {Topic} from '../types'

const topics: Topic[] = [
  {id: 'topic-1', title: 'Ordering coffee', description: 'Practise café small talk', level: 'A1'},
  {id: 'topic-2', title: 'Job interview', description: 'Talk through a mock interview', level: 'B2'},
]

describe('TopicSelector', () => {
  it('renders a card for each topic with its title, description and level', () => {
    render(<TopicSelector topics={topics} onSelect={vi.fn()} />)

    expect(screen.getByText('Ordering coffee')).toBeInTheDocument()
    expect(screen.getByText('Practise café small talk')).toBeInTheDocument()
    expect(screen.getByText('A1')).toBeInTheDocument()

    expect(screen.getByText('Job interview')).toBeInTheDocument()
    expect(screen.getByText('Talk through a mock interview')).toBeInTheDocument()
    expect(screen.getByText('B2')).toBeInTheDocument()
  })

  it('calls onSelect with the chosen topic', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<TopicSelector topics={topics} onSelect={onSelect} />)

    await user.click(screen.getByText('Job interview'))

    expect(onSelect).toHaveBeenCalledWith(topics[1])
  })
})
