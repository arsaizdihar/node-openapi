import { describe, expect, it, vi } from 'vitest';
import { createRoute, OpenAPIRouter, z } from '../src';
import { ZodError } from 'zod';

describe('OpenAPIRouter', () => {
  it('should create an instance', () => {
    const router = new OpenAPIRouter();
    expect(router).toBeInstanceOf(OpenAPIRouter);
  });

  it('should handle a simple GET route', async () => {
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
      (c) => {
        return c.typedJson({ data: { message: 'world' }, status: 200 });
      },
    );

    const response = await router.app.request('/hello');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'world' });
  });

  it('should apply middleware', async () => {
    const router = new OpenAPIRouter<{ Variables: { user?: string } }>();

    router.middleware(async (c, next) => {
      c.set('user', 'test-user');
      await next();
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
      (c) => {
        return c.typedJson({ data: { user: c.var.user }, status: 200 });
      },
    );

    const response = await router.app.request('/user');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: 'test-user' });
  });

  it('should handle route parameters', async () => {
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
      (c) => {
        const id = c.req.valid('param').id;
        return c.typedJson({ data: { itemId: id }, status: 200 });
      },
    );

    const response = await router.app.request('/items/123');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ itemId: '123' });
  });

  it('should handle query parameters', async () => {
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
      (c) => {
        const q = c.req.valid('query').q;
        return c.typedJson({ data: { query: q }, status: 200 });
      },
    );

    const response = await router.app.request('/search?q=test');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ query: 'test' });
  });

  it('should handle JSON body', async () => {
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

    router.route(route, async (c) => {
      const body = await c.req.json();
      return c.typedJson({ data: body, status: 201 });
    });

    const userData = { name: 'John Doe', age: 30 };
    const response = await router.app.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(userData);
  });

  it('should handle cookies', async () => {
    const router = new OpenAPIRouter();

    const route = createRoute({
      method: 'get',
      path: '/cookies',
      getRoutingPath: () => '/cookies',
      request: {
        cookies: z.object({
          sessionId: z.string(),
          theme: z.enum(['light', 'dark']),
        }),
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.object({
                sessionId: z.string(),
                theme: z.string(),
              }),
            },
          },
        },
      },
    });

    router.route(route, (c) => {
      const cookies = c.req.valid('cookie');
      return c.typedJson({
        data: {
          sessionId: cookies.sessionId,
          theme: cookies.theme,
        },
        status: 200,
      });
    });

    const response = await router.app.request('/cookies', {
      headers: {
        Cookie: 'sessionId=abc123; theme=dark',
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sessionId: 'abc123',
      theme: 'dark',
    });
  });

  it('should return validation error for invalid params', async () => {
    const router = new OpenAPIRouter();

    router.app.onError(async (err, c) => {
      if (err instanceof ZodError) {
        return c.json(
          {
            statusCode: 400,
            code: 'BAD_REQUEST',
            message: 'Invalid request',
            errors: {
              body: err.flatten().fieldErrors,
            },
            error: 'ValidationError',
          },
          400,
        );
      }
      throw err;
    });

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
      (c) => {
        const id = c.req.param('id');
        return c.typedJson({ data: { itemId: id } });
      },
    );

    const response = await router.app.request('/items/abc');

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error', 'ValidationError');
    expect(body).toHaveProperty('errors');
    expect(body.errors.body.id).toHaveLength(1);
    expect(body.errors.body.id[0]).toEqual('Invalid');
  });

  it('should validate response', async () => {
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
      (c) => {
        // @ts-expect-error - want to test validation error
        return c.typedJson({ data: { message: 123 }, status: 200 });
      },
    );

    const response = await router.app.request('/test');

    expect(response.status).toBe(500);
  });

  it('should not validate response when validateResponse is false', async () => {
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
      // @ts-expect-error - want to test validation error
      (c) => {
        return c.json({ message: 123 }, 200);
      },
    );

    const response = await router.app.request('/test');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 123 });
  });

  it('extends the router should have the same middleware and options', async () => {
    const router = new OpenAPIRouter({ validateResponse: false });

    const middleware = vi.fn(async (_c, next) => {
      console.log('middleware');
      await next();
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
      (c) => {
        return c.text('test', 200);
      },
    );

    await extendedRouter.app.request('/test');

    expect(extendedRouter).toBeInstanceOf(OpenAPIRouter);
    expect(extendedRouter).not.toBe(router);
    expect(middleware).toHaveBeenCalled();

    // @ts-expect-error - private field
    expect(extendedRouter._validateResponse).toBe(false);
  });

  it('should handle nested router correctly using router.use', async () => {
    const router = new OpenAPIRouter();

    const childRouter = new OpenAPIRouter();

    childRouter.route(
      createRoute({
        method: 'get',
        path: '/hello',
        getRoutingPath: () => '/hello',
        responses: { 200: { description: 'Success' } },
      }),
      (c) => {
        return c.typedJson({ data: { message: 'world' }, status: 200 });
      },
    );

    router.use('/api', childRouter);

    const response = await router.app.request('/api/hello');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'world' });
  });

  it('should generate openapi doc', async () => {
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
      (c) => {
        return c.typedJson({ data: { message: 'test' }, status: 200 });
      },
    );
    router.doc('/api', {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
    });

    const res = await router.app.request('/api');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
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
