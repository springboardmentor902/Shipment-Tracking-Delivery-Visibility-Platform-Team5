import client from './client'

export const createShipment = (payload) => client.post('/shipments', payload).then((r) => r.data)
export const getShipment = (id) => client.get(`/shipments/${id}`).then((r) => r.data)
export const trackShipment = (trackingNumber) =>
  client.get(`/shipments/track/${trackingNumber}`).then((r) => r.data)
export const getMyShipments = () => client.get('/shipments/my').then((r) => r.data)
export const getAllShipments = () => client.get('/shipments').then((r) => r.data)
export const cancelShipment = (id, cancellationReason) =>
  client.put(`/shipments/${id}/cancel`, { cancellationReason }).then((r) => r.data)
export const updateShipmentStatus = (id, status) =>
  client.put(`/shipments/${id}/status`, { status }).then((r) => r.data)
export const assignOperator = (id, operatorId) =>
  client.put(`/shipments/${id}/assign-operator/${operatorId}`).then((r) => r.data)
