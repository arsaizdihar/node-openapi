import { mainFactory } from '../api/main';

export const GET = mainFactory.doc('/api/doc', {
  openapi: '3.1.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
});
