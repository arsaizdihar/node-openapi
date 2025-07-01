import Hapi from '@hapi/hapi';
import { describe, expect, it, vi } from 'vitest';
import { createRoute, OpenAPIRouter, z } from '../src';
import { ZodError } from 'zod';

describe('OpenAPIRouter', () => {
  it('should create an instance', () => {
    const router = new OpenAPIRouter();
    expect(router).toBeInstanceOf(OpenAPIRouter);
  });

  it('should handle a simple GET route', async () => {
    const server = Hapi.server();
    const router = new OpenAPIRouter();

    router.route(
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
        return h.json({ data: { message: 'world' }, status: 200 });
      },
    );

    await router.registerServer(server);

    const response = await server.inject({
      method: 'GET',
      url: '/hello',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ message: 'world' });
  });

  it('should apply middleware', async () => {
    const server = Hapi.server();
    const router = new OpenAPIRouter<{ user?: string }>();

    router.middleware({
      assign: 'user',
      method: (req) => {
        req.app.user = 'test-user';
        return 'test-user';
      },
    });

    router.route(
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
        return h.json({ data: { user: context.user }, status: 200 });
      },
    );

    await router.registerServer(server);

    const response = await server.inject({
      method: 'GET',
      url: '/user',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ user: 'test-user' });
  });

  it('should handle route parameters', async () => {
    const server = Hapi.server();
    const router = new OpenAPIRouter();

    router.route(
      createRoute({
        method: 'get',
        path: '/items/{id}',
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
        return h.json({ data: { itemId: input.param.id }, status: 200 });
      },
    );

    await router.registerServer(server);

    const response = await server.inject({
      method: 'GET',
      url: '/items/123',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ itemId: '123' });
  });

  it('should handle query parameters', async () => {
    const server = Hapi.server();
    const router = new OpenAPIRouter();

    router.route(
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
        return h.json({ data: { query: input.query.q }, status: 200 });
      },
    );

    await router.registerServer(server);

    const response = await server.inject({
      method: 'GET',
      url: '/search?q=test',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ query: 'test' });
  });

  it('should handle JSON body', async () => {
    const server = Hapi.server();
    const router = new OpenAPIRouter();

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
      },
    });

    router.route(route, ({ h, input }) => {
      return h.json({ data: input.json, status: 201 });
    });

    await router.registerServer(server);

    const userData = { name: 'John Doe', age: 30 };
    const response = await server.inject({
      method: 'POST',
      url: '/users',
      payload: userData,
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.payload)).toEqual(userData);
  });

  it('should handle cookies', async () => {
    const server = Hapi.server();
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
      return h.json({ data: input.cookie, status: 200 });
    });

    await router.registerServer(server);

    const response = await server.inject({
      method: 'GET',
      url: '/profile',
      headers: {
        cookie: 'sessionId=abc123; userId=user456',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({
      sessionId: 'abc123',
      userId: 'user456',
    });
  });

  it('should return validation error for invalid params', async () => {
    const server = Hapi.server();
    const router = new OpenAPIRouter();

    server.ext('onPreResponse', (request, h) => {
      const response = request.response;
      if (!(response instanceof Error)) {
        return h.continue;
      }

      const err = response;
      if (err instanceof ZodError) {
        response.output.statusCode = 400;
        response.output.payload = {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'Invalid request',
          errors: {
            body: err.flatten().fieldErrors,
          },
          error: 'ValidationError',
        };
        return h.continue;
      }
      return h.continue;
    });

    router.route(
      createRoute({
        method: 'get',
        path: '/items/{id}',
        request: {
          params: z.object({ id: z.string().regex(/^\d+$/) }),
        },
        responses: { 200: { description: 'Success' } },
      }),
      ({ h, input }) => {
        return h.json({ data: { itemId: input.param.id } });
      },
    );

    await router.registerServer(server);

    const response = await server.inject({
      method: 'GET',
      url: '/items/abc',
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('error', 'ValidationError');
    expect(body).toHaveProperty('errors');
    expect(body.errors).toHaveProperty('body');
    expect(body.errors.body).toHaveProperty('id');
    expect(body.errors.body.id).toHaveLength(1);
    expect(body.errors.body.id[0]).toEqual('Invalid');
  });

  it('should validate response', async () => {
    const server = Hapi.server();
    const router = new OpenAPIRouter();

    router.route(
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
        return h.json({ data: { message: 123 }, status: 200 });
      },
    );

    await router.registerServer(server);

    const response = await server.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(500);
  });

  it('should not validate reponse when validateResponse is false', async () => {
    const server = Hapi.server();
    const router = new OpenAPIRouter({
      validateResponse: false,
    });

    router.route(
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
        return h.json({ data: { message: 123 }, status: 200 });
      },
    );
    await router.registerServer(server);

    const response = await server.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ message: 123 });
  });

  it('extends the router should have the same middleware and options', async () => {
    const server = Hapi.server();
    const router = new OpenAPIRouter();

    const middleware = vi.fn(async (_req, h) => {
      console.log('middleware');
      return h.continue;
    });
    router.middleware({ method: middleware });

    const extendedRouter = router.extend();

    extendedRouter.route(
      createRoute({
        method: 'get',
        path: '/test',
        responses: { 200: { description: 'Success' } },
      }),
      ({ h }) => {
        return h.text({ data: 'test', status: 200 });
      },
    );

    await extendedRouter.registerServer(server);

    await server.inject({
      method: 'GET',
      url: '/test',
    });

    expect(extendedRouter).toBeInstanceOf(OpenAPIRouter);
    expect(extendedRouter).not.toBe(router);
    expect(middleware).toHaveBeenCalled();
  });

  it('should handle nested router correctly using router.use', async () => {
    const server = Hapi.server();
    const router = new OpenAPIRouter();

    const childRouter = new OpenAPIRouter();

    childRouter.route(
      createRoute({
        method: 'get',
        path: '/hello',
        responses: { 200: { description: 'Success' } },
      }),
      ({ h }) => {
        return h.json({ data: { message: 'world' }, status: 200 });
      },
    );

    router.use('/api', childRouter);
    await router.registerServer(server);

    const response = await server.inject({
      method: 'GET',
      url: '/api/hello',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ message: 'world' });
  });

  it('should generate openapi doc', async () => {
    const server = Hapi.server();
    const router = new OpenAPIRouter();
    router.route(
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
        return h.json({ data: { message: 'test' }, status: 200 });
      },
    );
    router.doc('/api', {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
    });

    await router.registerServer(server);

    const res = await server.inject({
      method: 'GET',
      url: '/api',
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({
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
