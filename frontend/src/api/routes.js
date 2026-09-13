import client from './client'

/** GET /api/routes/{shipmentId} now returns the single current route (404 if none planned yet, not an empty array). */
export const getCurrentRoute = (shipmentId) =>
  client.get(`/routes/${shipmentId}`).then((r) => r.data)

/** The full re-route history for a shipment, oldest first. */
export const getRouteHistory = (shipmentId) =>
  client.get(`/routes/${shipmentId}/history`).then((r) => r.data)

export const planRoute = (shipmentId, payload) =>
  client.post(`/routes/${shipmentId}`, payload).then((r) => r.data)

export const completeRoute = (routeId, actualTimeMinutes) =>
  client.put(`/routes/${routeId}/complete`, { actualTimeMinutes }).then((r) => r.data)

/** Live Delivery Monitoring: POST /api/route/{id}/location (note: singular "route"). */
export const postDriverLocation = (routeId, { latitude, longitude }) =>
  client.post(`/route/${routeId}/location`, { latitude, longitude }).then((r) => r.data)
