import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyNotifications, markAsRead } from '../api/notifications'
import { useNotifications } from '../context/NotificationsContext'
import Loader from '../components/Loader'
import ErrorNote from '../components/ErrorNote'

export default function Notifications() {
  const navigate = useNavigate()
  const { refresh: refreshUnreadCount } = useNotifications()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Already ordered newest-first by the backend (findByUserIdOrderByCreatedAtDesc).
    getMyNotifications()
      .then(setItems)
      .catch((err) => setError(err.response?.data?.message || 'Could not load notifications.'))
      .finally(() => setLoading(false))
  }, [])

  // Clicking a notification marks it read (updating the sidebar/header bell count
  // immediately via refreshUnreadCount, not on the next 30s poll) and, if it's tied to a
  // shipment, opens that shipment.
  const handleClick = async (notification) => {
    if (notification.status !== 'READ') {
      try {
        const updated = await markAsRead(notification.id)
        setItems((prev) => prev.map((n) => (n.id === notification.id ? updated : n)))
        refreshUnreadCount()
      } catch {
        // Non-fatal - still navigate even if marking read failed.
      }
    }
    if (notification.shipmentId) {
      navigate(`/shipments/${notification.shipmentId}`)
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-slate mb-1">Notification Center</p>
      <h1 className="font-display font-semibold text-2xl mb-8">Notifications</h1>

      <ErrorNote message={error} />

      {loading ? (
        <Loader label="Loading notifications" />
      ) : items.length === 0 ? (
        <div className="stamp-card px-6 py-10 text-center">
          <p className="text-sm text-slate">Nothing here yet. Updates on your shipments will show up as they happen.</p>
        </div>
      ) : (
        <div className="divide-y divide-manifest border-t border-b border-manifest">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left py-4 px-2 flex items-start justify-between gap-4 transition-colors hover:bg-papershade ${n.status !== 'READ' ? 'bg-papershade' : ''}`}
            >
              <div className="flex items-start gap-3">
                {n.status !== 'READ' && <span className="w-1.5 h-1.5 rounded-full bg-beacon mt-1.5 shrink-0" />}
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-slate mt-0.5">{n.message}</p>
                  <p className="font-mono text-xs text-slate/70 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {n.status !== 'READ' && <span className="eyebrow shrink-0">Unread</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
