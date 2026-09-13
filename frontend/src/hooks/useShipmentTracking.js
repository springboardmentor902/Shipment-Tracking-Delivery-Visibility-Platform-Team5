import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'

/**
 * Connects to the /api/ws/tracking STOMP endpoint and subscribes to a single shipment's
 * location channel (/topic/shipment/{shipmentId}/location). Connects on mount, subscribes
 * once connected, and always unsubscribes + disconnects on unmount or when shipmentId
 * changes - this is the "connect when the tracking page opens, unsubscribe when it closes
 * or the user navigates away" requirement.
 *
 * Vite's dev proxy forwards WebSocket upgrades for /api/* to the backend (see
 * vite.config.js, ws: true), so the same host/port as the rest of the app works here too.
 */
export function useShipmentTracking(shipmentId, { enabled = true } = {}) {
  const [location, setLocation] = useState(null)
  const [connected, setConnected] = useState(false)
  const clientRef = useRef(null)

  useEffect(() => {
    if (!enabled || !shipmentId) return undefined

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const brokerURL = `${protocol}://${window.location.host}/api/ws/tracking`

    const client = new Client({
      brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/shipment/${shipmentId}/location`, (message) => {
          try {
            const payload = JSON.parse(message.body)
            setLocation(payload)
          } catch {
            // ignore malformed frames
          }
        })
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketError: () => setConnected(false),
    })

    clientRef.current = client
    client.activate()

    return () => {
      // Unsubscribe/disconnect whenever the shipment changes or the component unmounts -
      // covers both "page closed" and "navigated away".
      client.deactivate()
      clientRef.current = null
      setConnected(false)
    }
  }, [shipmentId, enabled])

  return { location, connected }
}
