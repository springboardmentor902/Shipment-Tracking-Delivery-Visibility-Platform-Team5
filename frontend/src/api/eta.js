import client from './client'

export const getEta = (shipmentId) => client.get(`/eta/${shipmentId}`).then((r) => r.data)
export const recalculateEta = (shipmentId) =>
  client.post(`/eta/${shipmentId}/predict`).then((r) => r.data)
