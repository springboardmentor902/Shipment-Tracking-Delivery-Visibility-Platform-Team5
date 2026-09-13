import client from './client'

export const createBusinessAccount = (payload) =>
  client
    .post('/business-accounts', payload)
    .then((response) => response.data)

export const getMyBusinessAccount = async () => {
  try {
    const response = await client.get('/business-accounts/me')
    return response.data
  } catch (error) {
    const status = error.response?.status

    if (status === 403 || status === 404) {
      return null
    }

    throw error
  }
}