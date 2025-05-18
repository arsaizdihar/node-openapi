import { store } from '~shared/store';
import { client } from './generated/client.gen';

export * from './generated';
export * from './generated/client.gen';

client.instance.interceptors.request.use((config) => {
  const token = store.getState().session?.token;
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export type ApiErrorData = {
  errors: {
    body: string[];
  };
};
