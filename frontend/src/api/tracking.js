import client from './client'

export const getTimeline = (shipmentId) =>
  client.get(`/tracking/${shipmentId}/timeline`).then((r) => r.data)
export const addTrackingEvent = (shipmentId, payload) =>
  client.post(`/tracking/${shipmentId}/events`, payload).then((r) => r.data)
