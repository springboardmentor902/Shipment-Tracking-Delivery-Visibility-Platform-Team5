import client from './client'

export const register = (payload) => client.post('/auth/register', payload).then((r) => r.data)
export const login = (payload) => client.post('/auth/login', payload).then((r) => r.data)
