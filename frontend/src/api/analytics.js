import client from './client'

// The old GET /analytics/overview and GET /analytics/business/{id} are retired on the
// backend (the latter had no ownership check and wasn't actually used) - these three
// self-scoped endpoints replace them.
export const getCustomerAnalytics = () => client.get('/analytics/customer').then((r) => r.data)
export const getBusinessAnalytics = () => client.get('/analytics/business').then((r) => r.data)
export const getAdminAnalytics = () => client.get('/analytics/admin').then((r) => r.data)
