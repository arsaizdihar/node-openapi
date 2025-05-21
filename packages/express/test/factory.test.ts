import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createRoute, ExpressRouteFactory, z } from '../src';

describe('ExpressRouteFactory', () => {
  it('should create an instance', () => {
    const factory = new ExpressRouteFactory();
    expect(factory).toBeInstanceOf(ExpressRouteFactory);
  });

  it('should handle a simple GET route', async () => {
    const app = express();
    const factory = new ExpressRouteFactory({ router: app });

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
      ({ h }) => {
        h.json({ status: 200, data: { message: 'world' } });
      },
    );

    const response = await request(app).get('/hello');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'world' });
  });

  it('should apply middleware', async () => {
    const app = express();
    const factory = new ExpressRouteFactory<{ user?: string }>({ router: app });

    factory.middleware(({ context }, next) => {
      context.user = 'test-user';
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
      ({ h, context }) => {
        h.json({ status: 200, data: { user: context.user } });
      },
    );

    const response = await request(app).get('/user');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: 'test-user' });
  });

  it('should handle route parameters', async () => {
    const app = express();
    const factory = new ExpressRouteFactory({ router: app });

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
      ({ h, input }) => {
        h.json({
          status: 200,
          data: { itemId: input.param.id },
        });
      },
    );

    const response = await request(app).get('/items/123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ itemId: '123' });
  });

  it('should handle query parameters', async () => {
    const app = express();
    const factory = new ExpressRouteFactory({ router: app });

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
      ({ h, input }) => {
        h.json({
          status: 200,
          data: { query: input.query.q },
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

    const factory = new ExpressRouteFactory({ router: app });

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

    factory.route(route, ({ h }) => {
      h.json({ status: 201, data: { name: 'John Doe', age: 30 } });
    });

    const userData = { name: 'John Doe', age: 30 };
    const response = await request(app).post('/users').send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(userData);
  });

  it('should return validation error for invalid params', async () => {
    const app = express();
    const factory = new ExpressRouteFactory({ router: app });

    factory.route(
      createRoute({
        method: 'get',
        path: '/items/:id',
        request: {
          params: z.object({ id: z.string().regex(/^\d+$/) }),
        },
        responses: { 200: { description: 'Success' } },
      }),
      ({ h, input }) => {
        h.json({ data: { itemId: input.param.id } });
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

  it('should validate response', async () => {
    const app = express();
    const factory = new ExpressRouteFactory({ router: app });

    factory.route(
      createRoute({
        method: 'get',
        path: '/test',
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': { schema: z.object({ message: z.string() }) },
            },
          },
        },
      }),
      ({ h }) => {
        // @ts-expect-error - want to test validation error
        h.json({ status: 200, data: { message: 123 } });
      },
    );

    const response = await request(app).get('/test');

    expect(response.status).toBe(500);
  });

  it('should not validate reponse when validateResponse is false', async () => {
    const app = express();
    const factory = new ExpressRouteFactory({
      router: app,
      validateResponse: false,
    });

    factory.route(
      createRoute({
        method: 'get',
        path: '/test',
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': { schema: z.object({ message: z.string() }) },
            },
          },
        },
      }),
      ({ h }) => {
        // @ts-expect-error - want to test validation error
        h.json({ status: 200, data: { message: 123 } });
      },
    );
    const response = await request(app).get('/test');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 123 });
  });

  it('extends the factory should have the same middleware and options', async () => {
    const app = express();
    const factory = new ExpressRouteFactory({ validateResponse: false });

    const middleware = vi.fn((_, next) => {
      console.log('middleware');
      next();
    });
    factory.middleware(middleware);

    const extendedFactory = factory.extend({ router: app });

    extendedFactory.route(
      createRoute({
        method: 'get',
        path: '/test',
        responses: { 200: { description: 'Success' } },
      }),
      ({ h }) => {
        h.text({ data: 'test' });
      },
    );

    await request(app).get('/test');

    expect(extendedFactory).toBeInstanceOf(ExpressRouteFactory);
    expect(extendedFactory).not.toBe(factory);
    expect(middleware).toHaveBeenCalled();

    // @ts-expect-error - private field
    expect(extendedFactory._validateResponse).toBe(false);
  });

  it('should handle nested router correctly using factory.router', async () => {
    const app = express();
    const factory = new ExpressRouteFactory({ router: app });

    const childFactory = new ExpressRouteFactory();

    childFactory.route(
      createRoute({
        method: 'get',
        path: '/hello',
        responses: { 200: { description: 'Success' } },
      }),
      ({ h }) => {
        h.json({ status: 200, data: { message: 'world' } });
      },
    );

    factory.router('/api', childFactory);

    const response = await request(app).get('/api/hello');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'world' });
  });

  it('should generate openapi doc', async () => {
    const app = express();
    const factory = new ExpressRouteFactory({ router: app });
    factory.route(
      createRoute({
        method: 'get',
        path: '/test',
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': { schema: z.object({ message: z.string() }) },
            },
          },
        },
      }),
      ({ h }) => {
        h.json({ status: 200, data: { message: 'test' } });
      },
    );
    factory.doc('/api', {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
    });

    const res = await request(app).get('/api');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      openapi: '3.1.0',
      info: {
        title: 'Test',
        version: '1.0.0',
      },
      components: {
        schemas: {},
        parameters: {},
      },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                        },
                      },
                      required: ['message'],
                    },
                  },
                },
              },
            },
          },
        },
      },
      webhooks: {},
    });
  });
});
