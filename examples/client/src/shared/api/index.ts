import { client } from './generated/client.gen'

export * from './generated/client.gen'
export * from './generated'

client.interceptors.request.use((request) => {
  const token = localStorage.getItem('token')
  if (token) {
    request.headers.set('Authorization', `Token ${token}`)
  }
  return request
})
