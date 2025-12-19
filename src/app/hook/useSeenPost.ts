import { useCallback, useRef } from 'react'
import { SeenPost } from '../types/Post/Post'

const BATCH_SIZE = 4

export function useSeenPost(flushSeen: (items: SeenPost[]) => Promise<void>) {
  const bufferRef = useRef<Map<string, SeenPost>>(new Map())
  const flushingRef = useRef(false)

  const makeKey = (item: SeenPost) => `${item.createdAt}:${item.feedId}`

  const addSeen = useCallback(
    async (item: SeenPost) => {
      const buffer = bufferRef.current
      const key = makeKey(item)

      if (buffer.has(key)) return
      buffer.set(key, item)

      if (buffer.size >= BATCH_SIZE && !flushingRef.current) {
        flushingRef.current = true
        const payload = Array.from(buffer.values())
        buffer.clear()
        try {
          await flushSeen(payload)
        } finally {
          flushingRef.current = false
        }
      }
    },
    [flushSeen]
  )

  const flushNow = useCallback(async () => {
    const buffer = bufferRef.current
    if (buffer.size === 0 || flushingRef.current) return
    flushingRef.current = true

    const payload = Array.from(buffer.values())
    buffer.clear()
    try {
      await flushSeen(payload)
    } finally {
      flushingRef.current = false
    }
  }, [flushSeen])

  return { addSeen, flushNow }
}
