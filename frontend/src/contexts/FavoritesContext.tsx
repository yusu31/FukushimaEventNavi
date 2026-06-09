'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/axios'
import { useAuth } from '@/contexts/AuthContext'
import type { Favorite } from '@/types/favorite'

type FavoritesContextType = {
  favorites: Favorite[]
  isFavorited: (eventId: number) => boolean
  toggleFavorite: (eventId: number) => Promise<void>
  isLoading: boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchFavorites = useCallback(async () => {
    if (!isLoggedIn) {
      setFavorites([])
      return
    }
    setIsLoading(true)
    try {
      const res = await apiClient.get<Favorite[]>('/api/v1/favorites')
      setFavorites(res.data)
    } catch {
      setFavorites([])
    } finally {
      setIsLoading(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const isFavorited = useCallback(
    (eventId: number) => favorites.some((f) => f.event_id === eventId),
    [favorites]
  )

  const toggleFavorite = useCallback(
    async (eventId: number) => {
      const existing = favorites.find((f) => f.event_id === eventId)
      if (existing) {
        await apiClient.delete(`/api/v1/favorites/${existing.id}`)
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id))
      } else {
        const res = await apiClient.post<Favorite>('/api/v1/favorites', { event_id: eventId })
        setFavorites((prev) => [res.data, ...prev])
      }
    },
    [favorites]
  )

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorited, toggleFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
