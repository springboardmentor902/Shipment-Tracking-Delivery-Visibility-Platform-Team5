import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { getUnreadCount } from '../api/notifications'

const NotificationsContext = createContext(null)

/**
 * Single source of truth for the unread notification count, so the sidebar bell badge and
 * the notification center never disagree. refresh() re-fetches from the backend; the
 * Notifications page calls it right after marking something read so the badge updates
 * immediately rather than waiting for the next poll.
 */
export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }
    try {
      const data = await getUnreadCount()
      setUnreadCount(data.unread)
    } catch {
      // Non-fatal - badge just keeps its last known value.
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
    // Light polling as a fallback/sync mechanism (e.g. a notification arriving from a
    // background job) - explicit user actions call refresh() directly for instant feedback.
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <NotificationsContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider')
  return ctx
}
