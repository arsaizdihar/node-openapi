import { createRoute } from '@node-openapi/express';
import { errorSchema } from 'ws-common/domain/errors.domain';
import {
  storeListParamsSchema,
  storeListResponseSchema,
  storeSchema,
} from 'ws-common/domain/store.domain';

export const getStoresRoute = createRoute({
  tags: ['store'],
  path: '/',
  method: 'get',
  request: {
    query: storeListParamsSchema,
  },
  responses: {
    200: {
      description: 'Stores',
      content: { 'application/json': { schema: storeListResponseSchema } },
    },
  },
});

export const getStoreRoute = createRoute({
  tags: ['store'],
  path: '/{id}',
  method: 'get',
  responses: {
    200: {
      description: 'Store details',
      content: { 'application/json': { schema: storeSchema } },
    },
    404: {
      description: 'Store not found',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});

export const updateStoreRoute = createRoute({
  tags: ['store'],
  path: '/{id}',
  method: 'put',
  responses: {
    200: {
      description: 'Store updated',
      content: { 'application/json': { schema: storeSchema } },
    },
    404: {
      description: 'Store not found',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});
