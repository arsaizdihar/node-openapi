import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createRoute, ExpressRouteFactory, helper, z } from '../src';

describe('ExpressRouteFactory', () => {
  it('should create an instance', () => {
    const factory = new ExpressRouteFactory();
    expect(factory).toBeInstanceOf(ExpressRouteFactory);
  });

  it('should handle a simple GET route', async () => {
    const app = express();
    const factory = new ExpressRouteFactory(app);

    factory.route(
      createRoute({
        method: 'get',
        path: '/hello',
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({
                  message: z.string(),
                }),
              },
            },
          },
        },
      }),
      (_req, res) => {
        helper(res).json({ status: 200, data: { message: 'world' } });
      },
    );

    const response = await request(app).get('/hello');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'world' });
  });

  it('should apply middleware', async () => {
    const app = express();
    const factory = new ExpressRouteFactory<{ user?: string }>(app);

    factory.middleware((_req, res, next) => {
      res.locals.user = 'test-user';
      next();
    });

    factory.route(
      createRoute({
        method: 'get',
        path: '/user',
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({
                  user: z.string().optional(),
                }),
              },
            },
          },
        },
      }),
      (_req, res) => {
        helper(res).json({ status: 200, data: { user: res.locals.user } });
      },
    );

    const response = await request(app).get('/user');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: 'test-user' });
  });

  it('should handle route parameters', async () => {
    const app = express();
    const factory = new ExpressRouteFactory(app);

    factory.route(
      createRoute({
        method: 'get',
        path: '/items/:id',
        request: {
          params: z.object({ id: z.string().regex(/^\d+$/) }),
        },
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({ itemId: z.string() }),
              },
            },
          },
        },
      }),
      (_req, res) => {
        helper(res).json({
          status: 200,
          data: { itemId: res.locals.params.id },
        });
      },
    );

    const response = await request(app).get('/items/123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ itemId: '123' });
  });

  it('should handle query parameters', async () => {
    const app = express();
    const factory = new ExpressRouteFactory(app);

    factory.route(
      createRoute({
        method: 'get',
        path: '/search',
        request: {
          query: z.object({ q: z.string() }),
        },
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({ query: z.string() }),
              },
            },
          },
        },
      }),
      (_req, res) => {
        helper(res).json({
          status: 200,
          data: { query: res.locals.query.q },
        });
      },
    );

    const response = await request(app).get('/search?q=test');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ query: 'test' });
  });

  it('should handle JSON body', async () => {
    const app = express();
    app.use(express.json());

    const factory = new ExpressRouteFactory(app);

    const BodySchema = z.object({
      name: z.string(),
      age: z.number().int(),
    });

    const route = createRoute({
      method: 'post',
      path: '/users',
      request: {
        body: {
          content: {
            'application/json': {
              schema: BodySchema,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: BodySchema,
            },
          },
        },
        202: {
          description: 'Accepted',
          content: {
            'application/json': {
              schema: z.object({
                hello: z.string(),
              }),
            },
          },
        },
        200: {
          description: 'Success',
          content: {
            'text/plain': {
              schema: z.string(),
            },
          },
        },
      },
    });

    factory.route(route, (_req, res) => {
      helper(res).json({ status: 201, data: { name: 'John Doe', age: 30 } });
    });

    const userData = { name: 'John Doe', age: 30 };
    const response = await request(app).post('/users').send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(userData);
  });

  it('should return validation error for invalid params', async () => {
    const app = express();
    const factory = new ExpressRouteFactory(app);

    factory.route(
      createRoute({
        method: 'get',
        path: '/items/:id',
        request: {
          params: z.object({ id: z.string().regex(/^\d+$/) }),
        },
        responses: { 200: { description: 'Success' } },
      }),
      (_req, res) => {
        res.json({ itemId: res.locals.params.id });
      },
    );

    // Add a generic error handler
    app.use((err: any, _req: any, res: any, _next: any) => {
      console.error(err); // For debugging in test output
      res.status(400).json({ error: 'Validation failed', details: err.issues });
    });

    const response = await request(app).get('/items/abc');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Validation failed');
    expect(response.body).toHaveProperty('details');
    expect(response.body.details[0].path).toEqual(['id']);
  });
});
