import type { CreateClientConfig } from './generated/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});
