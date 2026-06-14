'use client'

import { useState, useCallback, useEffect } from 'react'

type ConquestEntry = {
  id: number
  region_id: string
  conquered_at: string
}

export function useConquerCollection() {
  const [conquests, setConquests] = useState<ConquestEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/region_conquests')
      .then((res) => {
        if (!res.ok) return []
        return res.json()
      })
      .then((data: unknown) => setConquests(Array.isArray(data) ? data : []))
      .catch(() => setConquests([]))
      .finally(() => setIsLoading(false))
  }, [])

  const addConquest = useCallback(async (regionId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/region_conquests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region_conquest: {
            region_id: regionId,
            conquered_at: new Date().toISOString(),
          },
        }),
      })
      if (!res.ok) return false
      const entry: ConquestEntry = await res.json()
      setConquests((prev) => {
        const exists = prev.some((c) => c.region_id === regionId)
        return exists ? prev : [...prev, entry]
      })
      return true
    } catch {
      return false
    }
  }, [])

  const hasConquered = useCallback(
    (regionId: string) => conquests.some((c) => c.region_id === regionId),
    [conquests]
  )

  return { conquests, isLoading, addConquest, hasConquered }
}
