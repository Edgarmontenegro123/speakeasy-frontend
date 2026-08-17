import {useCallback, useRef, useState} from 'react'

export type RecorderStatus = 'idle' | 'recording' | 'error'

export function useAudioRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true})
      const recorder = new MediaRecorder(stream)

      chunksRef.current = []
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      })

      streamRef.current = stream
      recorderRef.current = recorder
      recorder.start()
      setStatus('recording')
    } catch {
      setStatus('error')
    }
  }, [])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current

      if (!recorder || recorder.state === 'inactive') {
        resolve(null)
        return
      }

      recorder.addEventListener(
        'stop',
        () => {
          streamRef.current?.getTracks().forEach((track) => track.stop())
          streamRef.current = null
          recorderRef.current = null
          setStatus('idle')
          resolve(new Blob(chunksRef.current, {type: 'audio/webm'}))
        },
        {once: true},
      )

      recorder.stop()
    })
  }, [])

  return {status, startRecording, stopRecording}
}
