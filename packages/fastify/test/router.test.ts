import fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { createRoute, OpenAPIRouter, z } from '../src';
import { ZodError } from 'zod';
import cookie from '@fastify/cookie';

describe('OpenAPIRouter', () => {
  it('should create an instance', () => {
    const router = new OpenAPIRouter();
    expect(router).toBeInstanceOf(OpenAPIRouter);
  });

  it('should handle a simple GET route', async () => {
    const app = fastify();
    const router = new OpenAPIRouter();

    router.route(
      createRoute({
        method: 'get',
        path: '/hello',
        getRoutingPath: () => '/hello',
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
        h.json({ data: { message: 'world' }, status: 200 });
      },
    );

    router.registerApp(app);

    const response = await app.inject({
      method: 'GET',
      url: '/hello',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ message: 'world' });
  });

  it('should apply middleware', async () => {
    const app = fastify();
    const router = new OpenAPIRouter<{ user?: string }>();

    router.middleware((_req, _res, { context }) => {
      context.user = 'test-user';
      return Promise.resolve();
    });

    router.route(
      createRoute({
        method: 'get',
        path: '/user',
        getRoutingPath: () => '/user',
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
        h.json({ data: { user: context.user }, status: 200 });
      },
    );

    router.registerApp(app);

    const response = await app.inject({
      method: 'GET',
      url: '/user',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ user: 'test-user' });
  });

  it('should handle route parameters', async () => {
    const app = fastify();
    const router = new OpenAPIRouter();

    router.route(
      createRoute({
        method: 'get',
        path: '/items/{id}',
        getRoutingPath: () => '/items/:id',
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
          data: {
            itemId: input.param.id,
          },
          status: 200,
        });
      },
    );

    router.registerApp(app);

    const response = await app.inject({
      method: 'GET',
      url: '/items/123',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ itemId: '123' });
  });

  it('should handle query parameters', async () => {
    const app = fastify();
    const router = new OpenAPIRouter();

    router.route(
      createRoute({
        method: 'get',
        path: '/search',
        getRoutingPath: () => '/search',
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
          data: {
            query: input.query.q,
          },
          status: 200,
        });
      },
    );

    router.registerApp(app);

    const response = await app.inject({
      method: 'GET',
      url: '/search?q=test',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ query: 'test' });
  });

  it('should handle JSON body', async () => {
    const app = fastify();
    const router = new OpenAPIRouter();

    const BodySchema = z.object({
      name: z.string(),
      age: z.number().int(),
    });

    const route = createRoute({
      method: 'post',
      path: '/users',
      getRoutingPath: () => '/users',
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
      },
    });

    router.route(route, ({ h }) => {
      h.json({ data: { name: 'John Doe', age: 30 }, status: 201 });
    });

    router.registerApp(app);

    const userData = { name: 'John Doe', age: 30 };
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: userData,
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual(userData);
  });

  it('should handle cookies', async () => {
    const app = fastify();
    app.register(cookie);
    app.setErrorHandler((err, req, reply) => {
      if (err instanceof ZodError) {
        console.log(req.headers.cookie);
        return reply.status(400).send({
          status: 400,
          errors: {
            body: err.flatten().fieldErrors,
          },
        });
      }
      return reply.status(500).send({
        status: 500,
        errors: {
          body: ['Internal Server Error'],
        },
      });
    });
    const router = new OpenAPIRouter();

    const CookieSchema = z.object({
      sessionId: z.string(),
      userId: z.string(),
    });

    const route = createRoute({
      method: 'get',
      path: '/profile',
      request: {
        cookies: CookieSchema,
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.object({
                sessionId: z.string(),
                userId: z.string(),
              }),
            },
          },
        },
      },
    });

    router.route(route, ({ h, input }) => {
      h.json({ data: input.cookie, status: 200 });
    });

    router.registerApp(app);

    const response = await app.inject({
      method: 'GET',
      url: '/profile',
      headers: {
        cookie: 'sessionId=abc123; userId=user456',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      sessionId: 'abc123',
      userId: 'user456',
    });
  });

  it('should return validation error for invalid params', async () => {
    const app = fastify();
    const router = new OpenAPIRouter();

    router.route(
      createRoute({
        method: 'get',
        path: '/items/{id}',
        getRoutingPath: () => '/items/:id',
        request: {
          params: z.object({ id: z.string().regex(/^\d+$/) }),
        },
        responses: { 200: { description: 'Success' } },
      }),
      ({ h, input }) => {
        h.json({ data: { itemId: input.param.id }, status: 200 });
      },
    );

    router.registerApp(app);

    const response = await app.inject({
      method: 'GET',
      url: '/items/abc',
    });

    expect(response.statusCode).toBe(500);
  });

  it('should validate response', async () => {
    const app = fastify();
    const router = new OpenAPIRouter();

    router.route(
      createRoute({
        method: 'get',
        path: '/test',
        getRoutingPath: () => '/test',
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
        h.json({ data: { message: 123 }, status: 200 });
      },
    );

    router.registerApp(app);

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(500);
  });

  it('should not validate reponse when validateResponse is false', async () => {
    const app = fastify();
    const router = new OpenAPIRouter({
      validateResponse: false,
    });

    router.route(
      createRoute({
        method: 'get',
        path: '/test',
        getRoutingPath: () => '/test',
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
        h.json({ data: { message: 123 }, status: 200 });
      },
    );
    router.registerApp(app);

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ message: 123 });
  });

  it('extends the router should have the same middleware and options', async () => {
    const app = fastify();
    const router = new OpenAPIRouter({ validateResponse: false });

    const middleware = vi.fn((_req: any, _reply: any, next: any) => {
      console.log('middleware');
      next();
      return Promise.resolve();
    });
    router.middleware(middleware);

    const extendedRouter = router.extend();

    extendedRouter.route(
      createRoute({
        method: 'get',
        path: '/test',
        getRoutingPath: () => '/test',
        responses: { 200: { description: 'Success' } },
      }),
      ({ h }) => {
        h.text({ data: 'test', status: 200 });
      },
    );

    extendedRouter.registerApp(app);

    await app.inject({
      method: 'GET',
      url: '/test',
    });

    expect(extendedRouter).toBeInstanceOf(OpenAPIRouter);
    expect(extendedRouter).not.toBe(router);
    expect(middleware).toHaveBeenCalled();

    // @ts-expect-error - private field
    expect(extendedRouter._validateResponse).toBe(false);
  });

  it('should handle nested router correctly using router.use', async () => {
    const app = fastify();
    const router = new OpenAPIRouter();

    const childRouter = new OpenAPIRouter();

    childRouter.route(
      createRoute({
        method: 'get',
        path: '/hello',
        getRoutingPath: () => '/hello',
        responses: { 200: { description: 'Success' } },
      }),
      ({ h }) => {
        h.json({ data: { message: 'world' }, status: 200 });
      },
    );

    router.use('/api', childRouter);
    router.registerApp(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/hello',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ message: 'world' });
  });

  it('should generate openapi doc', async () => {
    const app = fastify();
    const router = new OpenAPIRouter();
    router.route(
      createRoute({
        method: 'get',
        path: '/test',
        getRoutingPath: () => '/test',
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
        h.json({ data: { message: 'test' }, status: 200 });
      },
    );
    router.doc('/api', {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
    });

    router.registerApp(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api',
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
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
