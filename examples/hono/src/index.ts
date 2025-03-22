import { createRoute, HonoRouteFactory } from '@node-openapi/hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { swaggerUI } from '@hono/swagger-ui';
import { serve } from '@hono/node-server';

const app = new Hono();

const factory = new HonoRouteFactory(app);

const route = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({
              example: 'Hello, world!',
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: 'OK',
    },
  },
});

factory.route(route, (c) => {
  return c.json({
    message: c.req.valid('json').message,
  });
});

factory.doc('/docs', {
  openapi: '3.1.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
});

app.get('/api-docs', swaggerUI({ url: '/docs' }));

serve(app);
