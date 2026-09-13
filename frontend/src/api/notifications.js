import client from './client'

export const getMyNotifications = () => client.get('/notifications').then((r) => r.data)
export const getUnreadCount = () => client.get('/notifications/unread-count').then((r) => r.data)
export const markAsRead = (id) => client.patch(`/notifications/${id}/read`).then((r) => r.data)
