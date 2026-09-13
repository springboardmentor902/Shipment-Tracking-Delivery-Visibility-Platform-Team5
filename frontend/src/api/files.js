import client from './client'

/**
 * Uploads a File/Blob (signature capture or a photo) and returns { url }. Content-Type is
 * intentionally left unset here (rather than the client's default 'application/json') so
 * the browser/axios can compute the correct multipart boundary itself.
 */
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return client
    .post('/files/upload', formData, { headers: { 'Content-Type': undefined } })
    .then((r) => r.data)
}
