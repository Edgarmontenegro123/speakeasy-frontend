import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {useAudioRecorder} from './useAudioRecorder'

class MockMediaRecorder {
  static instances: MockMediaRecorder[] = []
  state: 'inactive' | 'recording' = 'inactive'
  start = vi.fn(() => {
    this.state = 'recording'
  })
  stream: MediaStream
  private listeners: Record<string, Array<(event: unknown) => void>> = {}

  constructor(stream: MediaStream) {
    this.stream = stream
    MockMediaRecorder.instances.push(this)
  }

  addEventListener(event: string, handler: (event: unknown) => void) {
    this.listeners[event] = [...(this.listeners[event] ?? []), handler]
  }

  stop() {
    this.state = 'inactive'
    this.listeners.dataavailable?.forEach((handler) => handler({data: new Blob(['chunk'])}))
    this.listeners.stop?.forEach((handler) => handler({}))
  }
}

function createMockStream() {
  const stop = vi.fn()
  return {getTracks: () => [{stop}], stop}
}

describe('useAudioRecorder', () => {
  beforeEach(() => {
    MockMediaRecorder.instances = []
    vi.stubGlobal('MediaRecorder', MockMediaRecorder)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {getUserMedia: vi.fn().mockResolvedValue(createMockStream())},
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts idle', () => {
    const {result} = renderHook(() => useAudioRecorder())
    expect(result.current.status).toBe('idle')
  })

  it('requests the microphone and starts recording', async () => {
    const {result} = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({audio: true})
    expect(result.current.status).toBe('recording')
    expect(MockMediaRecorder.instances[0].start).toHaveBeenCalledOnce()
  })

  it('sets an error status when microphone access is denied', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(new Error('denied'))
    const {result} = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.status).toBe('error')
  })

  it('stops recording, releases the microphone, and resolves with the recorded blob', async () => {
    const {result} = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    let blob: Blob | null = null
    await act(async () => {
      blob = await result.current.stopRecording()
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(result.current.status).toBe('idle')
  })

  it('resolves with null when stopRecording is called without an active recording', async () => {
    const {result} = renderHook(() => useAudioRecorder())

    let blob: Blob | null = new Blob()
    await act(async () => {
      blob = await result.current.stopRecording()
    })

    expect(blob).toBeNull()
  })
})
