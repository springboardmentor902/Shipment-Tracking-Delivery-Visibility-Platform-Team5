import client from './client'

export const submitPod = (shipmentId, payload) =>
  client.post(`/pod/${shipmentId}`, payload).then((r) => r.data)
export const verifyPod = (shipmentId, approved) =>
  client.patch(`/pod/${shipmentId}/verify`, { approved }).then((r) => r.data)
export const getPod = (shipmentId) => client.get(`/pod/${shipmentId}`).then((r) => r.data)
export const getPendingVerifications = () => client.get('/pod/pending').then((r) => r.data)
