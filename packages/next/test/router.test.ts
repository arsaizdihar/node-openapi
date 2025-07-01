import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { createRoute, OpenAPIRouter, z } from '../src';
import { Router, HandlerArgs } from '../src/router';
import { ZodError } from 'zod';

function setupErrorHandler(router: OpenAPIRouter) {
  router.onError((_, err) => {
    console.error(err);
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          status: 400,
          errors: {
            body: err.flatten().fieldErrors,
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        status: 500,
        errors: {
          body: ['Internal Server Error'],
        },
      },
      { status: 500 },
    );
  });
}

describe('Router', () => {
  it('should create an instance', () => {
    const router = new Router();
    expect(router).toBeInstanceOf(Router);
  });

  it('should add routes correctly', async () => {
    const router = new Router();
    const handler = ({ req }: HandlerArgs) => {
      return new NextResponse(JSON.stringify({ method: req.method }), {
        headers: { 'Content-Type': 'application/json' },
      });
    };

    router.add('get', '/test', handler);

    const req = new NextRequest(new URL('http://localhost/test'), {
      method: 'GET',
    });
    const result = await router.dispatch(req);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.response.status).toBe(200);
      expect(await result.response.json()).toEqual({ method: 'GET' });
    }
  });

  it('should throw error for duplicate routes', () => {
    const router = new Router();
    const handler = () => new NextResponse('test');

    router.add('get', '/test', handler);
    router.add('get', '/test', handler);

    expect(() => router.build()).toThrow('Duplicate route: get /test');
  });

  it('should add middleware correctly', async () => {
    const router = new Router();
    const middlewareExecuted = vi.fn();

    router.middleware(async (args) => {
      middlewareExecuted();
      args.context.middlewareRan = true;
    });

    router.add('get', '/test', ({ context }) => {
      return new NextResponse(
        JSON.stringify({ middlewareRan: context.middlewareRan }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    const req = new NextRequest(new URL('http://localhost/test'), {
      method: 'GET',
    });
    const result = await router.dispatch(req);

    expect(middlewareExecuted).toHaveBeenCalled();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(await result.response.json()).toEqual({ middlewareRan: true });
    }
  });

  it('should handle middleware that returns a response early', async () => {
    const router = new Router();
    const handlerShouldNotExecute = vi.fn();

    router.middleware(async () => {
      return new NextResponse('Middleware response', { status: 401 });
    });

    router.add('get', '/test', () => {
      handlerShouldNotExecute();
      return new NextResponse('Handler response');
    });

    const req = new NextRequest(new URL('http://localhost/test'), {
      method: 'GET',
    });
    const result = await router.dispatch(req);

    expect(handlerShouldNotExecute).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.response.status).toBe(401);
      expect(await result.response.text()).toBe('Middleware response');
    }
  });

  it('should handle 404 for unmatched routes', async () => {
    const router = new Router();

    const req = new NextRequest(new URL('http://localhost/nonexistent'), {
      method: 'GET',
    });
    const result = await router.dispatch(req);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.response.status).toBe(404);
      expect(await result.response.text()).toBe('Not Found');
    }
  });

  it('should handle errors in handlers', async () => {
    const router = new Router();

    router.add('get', '/error', () => {
      throw new Error('Handler error');
    });

    const req = new NextRequest(new URL('http://localhost/error'), {
      method: 'GET',
    });
    const result = await router.dispatch(req);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe('Handler error');
    }
  });

  it('should handle errors in middleware', async () => {
    const router = new Router();

    router.middleware(async () => {
      throw new Error('Middleware error');
    });

    router.add('get', '/test', () => new NextResponse('success'));

    const req = new NextRequest(new URL('http://localhost/test'), {
      method: 'GET',
    });
    const result = await router.dispatch(req);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe('Middleware error');
    }
  });

  it('should handle nested routers correctly', async () => {
    const router = new Router();
    const childRouter = new Router();

    childRouter.add('get', '/child', () => {
      return new NextResponse('child response');
    });

    router.use('/api', childRouter);

    const req = new NextRequest(new URL('http://localhost/api/child'), {
      method: 'GET',
    });
    const result = await router.dispatch(req);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.response.status).toBe(200);
      expect(await result.response.text()).toBe('child response');
    }
  });

  it('should merge middlewares from parent and child routers', async () => {
    const router = new Router();
    const childRouter = new Router();
    const parentMiddleware = vi.fn();
    const childMiddleware = vi.fn();

    router.middleware(async (args) => {
      parentMiddleware();
      args.context.parent = true;
    });

    childRouter.middleware(async (args) => {
      childMiddleware();
      args.context.child = true;
    });

    childRouter.add('get', '/test', ({ context }) => {
      return new NextResponse(JSON.stringify(context), {
        headers: { 'Content-Type': 'application/json' },
      });
    });

    router.use('/api', childRouter);

    const req = new NextRequest(new URL('http://localhost/api/test'), {
      method: 'GET',
    });
    const result = await router.dispatch(req);

    expect(parentMiddleware).toHaveBeenCalled();
    expect(childMiddleware).toHaveBeenCalled();
    expect(result.success).toBe(true);
    if (result.success) {
      const responseData = await result.response.json();
      expect(responseData.parent).toBe(true);
      expect(responseData.child).toBe(true);
    }
  });

  it('should throw error for duplicate routes in nested routers', () => {
    const router = new Router();
    const childRouter = new Router();

    router.add('get', '/api/test', () => new NextResponse('parent'));
    childRouter.add('get', '/test', () => new NextResponse('child'));

    router.use('/api', childRouter);

    expect(() => router.build()).toThrow('Duplicate route: get /api/test');
  });

  it('should handle deeply nested routers', async () => {
    const router = new Router();
    const childRouter = new Router();
    const grandchildRouter = new Router();

    grandchildRouter.add('get', '/deep', () => {
      return new NextResponse('deep response');
    });

    childRouter.use('/child', grandchildRouter);
    router.use('/api', childRouter);

    const req = new NextRequest(new URL('http://localhost/api/child/deep'), {
      method: 'GET',
    });
    const result = await router.dispatch(req);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.response.status).toBe(200);
      expect(await result.response.text()).toBe('deep response');
    }
  });

  it('should copy router correctly', () => {
    const router = new Router();
    const handler = () => new NextResponse('test');
    const middleware = async () => {};

    router.add('get', '/test', handler);
    router.middleware(middleware);

    const childRouter = new Router();
    router.use('/api', childRouter);

    const copiedRouter = router.copy();

    expect(copiedRouter).toBeInstanceOf(Router);
    expect(copiedRouter).not.toBe(router);

    // Verify that the copied router has the same routes and middlewares
    // @ts-expect-error - accessing private field for testing
    expect(copiedRouter._routes).toEqual(router._routes);
    // @ts-expect-error - accessing private field for testing
    expect(copiedRouter._middlewares).toEqual(router._middlewares);
    // @ts-expect-error - accessing private field for testing
    expect(copiedRouter._children).toEqual(router._children);
  });

  it('should cache radix router after first build', () => {
    const router = new Router();
    router.add('get', '/test', () => new NextResponse('test'));

    const firstBuild = router.build();
    const secondBuild = router.build();

    expect(firstBuild).toBe(secondBuild);
  });

  it('should handle route parameters correctly', async () => {
    const router = new Router();

    router.add('get', '/users/:id', ({ params }) => {
      return new NextResponse(JSON.stringify({ userId: params.id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const req = new NextRequest(new URL('http://localhost/users/123'), {
      method: 'GET',
    });
    const result = await router.dispatch(req);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.response.status).toBe(200);
      expect(await result.response.json()).toEqual({ userId: '123' });
    }
  });

  it('should handle multiple HTTP methods on same path', async () => {
    const router = new Router();

    router.add('get', '/api/test', () => new NextResponse('GET response'));
    router.add('post', '/api/test', () => new NextResponse('POST response'));

    const getReq = new NextRequest(new URL('http://localhost/api/test'), {
      method: 'GET',
    });
    const getResult = await router.dispatch(getReq);

    const postReq = new NextRequest(new URL('http://localhost/api/test'), {
      method: 'POST',
    });
    const postResult = await router.dispatch(postReq);

    expect(getResult.success && postResult.success).toBe(true);
    if (getResult.success && postResult.success) {
      expect(await getResult.response.text()).toBe('GET response');
      expect(await postResult.response.text()).toBe('POST response');
    }
  });
});

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
      ({ h }) => {
        return h.json({ data: { message: 'world' } });
      },
    );

    const req = new NextRequest(new URL('http://localhost/hello'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'world' });
  });

  it('should apply middleware', async () => {
    const router = new OpenAPIRouter<{ user?: string }>();

    router.middleware(async (args) => {
      args.context.user = 'test-user';
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
        return h.json({ data: { user: context.user } });
      },
    );

    const req = new NextRequest(new URL('http://localhost/user'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: 'test-user' });
  });

  it('should handle route parameters', async () => {
    const router = new OpenAPIRouter();

    router.route(
      createRoute({
        method: 'get',
        path: '/items/{id}',
        getRoutingPath: () => '/items/[id]',
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
        return h.json({ data: { itemId: input.param.id } });
      },
    );

    const req = new NextRequest(new URL('http://localhost/items/123'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

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
      ({ h, input }) => {
        return h.json({ data: { query: input.query.q } });
      },
    );

    const req = new NextRequest(new URL('http://localhost/search?q=test'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

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

    router.route(route, ({ h, input }) => {
      return h.json({ data: input.json, status: 201 });
    });

    const userData = { name: 'John Doe', age: 30 };
    const req = new NextRequest(new URL('http://localhost/users'), {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: { 'Content-Type': 'application/json' },
    });
    const handler = router.handlers.POST!;
    const response = await handler(req);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(userData);
  });

  it('should handle cookie validation', async () => {
    const router = new OpenAPIRouter();

    setupErrorHandler(router);

    router.route(
      createRoute({
        method: 'get',
        path: '/cookie-test',
        getRoutingPath: () => '/cookie-test',
        request: {
          cookies: z.object({
            sessionId: z.string(),
            theme: z.enum(['light', 'dark']).optional(),
          }),
        },
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({
                  sessionId: z.string(),
                  theme: z.string().optional(),
                }),
              },
            },
          },
        },
      }),
      ({ h, input }) => {
        return h.json({
          data: {
            sessionId: input.cookie.sessionId,
            theme: input.cookie.theme,
          },
        });
      },
    );

    const req = new NextRequest(new URL('http://localhost/cookie-test'), {
      method: 'GET',
      headers: {
        Cookie: 'sessionId=abc123; theme=dark',
      },
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sessionId: 'abc123',
      theme: 'dark',
    });

    // Test with invalid cookie
    const invalidReq = new NextRequest(
      new URL('http://localhost/cookie-test'),
      {
        method: 'GET',
        headers: {
          Cookie: 'theme=invalid',
        },
      },
    );
    const invalidResponse = await handler(invalidReq);

    expect(invalidResponse.status).toBe(400);
  });

  it('should handle PUT method', async () => {
    const router = new OpenAPIRouter();

    router.route(
      createRoute({
        method: 'put',
        path: '/items/{id}',
        getRoutingPath: () => '/items/[id]',
        request: {
          params: z.object({ id: z.string() }),
          body: {
            content: {
              'application/json': {
                schema: z.object({ name: z.string() }),
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({ id: z.string(), name: z.string() }),
              },
            },
          },
        },
      }),
      ({ h, input }) => {
        return h.json({ data: { id: input.param.id, name: input.json.name } });
      },
    );

    const req = new NextRequest(new URL('http://localhost/items/123'), {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Item' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const handler = router.handlers.PUT!;
    const response = await handler(req);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: '123',
      name: 'Updated Item',
    });
  });

  it('should handle DELETE method', async () => {
    const router = new OpenAPIRouter();

    router.route(
      createRoute({
        method: 'delete',
        path: '/items/{id}',
        getRoutingPath: () => '/items/[id]',
        request: {
          params: z.object({ id: z.string() }),
        },
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({ message: z.string() }),
              },
            },
          },
        },
      }),
      ({ h }) => {
        return h.json({ data: { message: 'Deleted successfully' } });
      },
    );

    const req = new NextRequest(new URL('http://localhost/items/123'), {
      method: 'DELETE',
    });
    const handler = router.handlers.DELETE!;
    const response = await handler(req);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'Deleted successfully' });
  });

  it('should return validation error for invalid params', async () => {
    const router = new OpenAPIRouter();

    setupErrorHandler(router);

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

    const req = new NextRequest(new URL('http://localhost/items/abc'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

    expect(response.status).toBe(400);
    const errorBody = await response.json();
    expect(errorBody).toHaveProperty('errors');
  });

  it('should validate response', async () => {
    const router = new OpenAPIRouter();

    setupErrorHandler(router);

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
        return h.json({ data: { message: 123 } });
      },
    );

    const req = new NextRequest(new URL('http://localhost/test'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

    expect(response.status).toBe(500);
  });

  it('should not validate reponse when validateResponse is false', async () => {
    const router = new OpenAPIRouter({
      validateResponse: false,
    });

    setupErrorHandler(router);

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
        return h.json({ data: { message: 123 } });
      },
    );
    const req = new NextRequest(new URL('http://localhost/test'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 123 });
  });

  it('extends the router should have the same middleware and options', async () => {
    const router = new OpenAPIRouter({ validateResponse: false });

    const middleware = vi.fn(async () => {
      console.log('middleware');
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
        return h.json({ data: { message: 'test' } });
      },
    );

    const req = new NextRequest(new URL('http://localhost/test'), {
      method: 'GET',
    });
    const handler = extendedRouter.handlers.GET!;
    await handler(req);

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
      ({ h }) => {
        return h.json({ data: { message: 'world' } });
      },
    );

    router.use('/api', childRouter);

    const req = new NextRequest(new URL('http://localhost/api/hello'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

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
      ({ h }) => {
        return h.json({ data: { message: 'test' } });
      },
    );
    router.doc('/api', {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
    });

    const req = new NextRequest(new URL('http://localhost/api'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const res = await handler(req);

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

  it('should handle text responses', async () => {
    const router = new OpenAPIRouter();

    router.route(
      createRoute({
        method: 'get',
        path: '/text',
        getRoutingPath: () => '/text',
        responses: {
          200: {
            description: 'Success',
            content: {
              'text/plain': {
                schema: z.string(),
              },
            },
          },
        },
      }),
      ({ h }) => {
        return h.text({ data: 'Hello World', status: 200 });
      },
    );

    const req = new NextRequest(new URL('http://localhost/text'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Hello World');
    expect(response.headers.get('Content-Type')).toBe('text/plain');
  });

  it('should test simple HTTP method handlers', async () => {
    const router = new OpenAPIRouter();

    // Test all simple HTTP methods
    router.get('/get-test', () => new NextResponse('GET response'));
    router.post('/post-test', () => new NextResponse('POST response'));
    router.put('/put-test', () => new NextResponse('PUT response'));
    router.delete('/delete-test', () => new NextResponse('DELETE response'));
    router.patch('/patch-test', () => new NextResponse('PATCH response'));
    router.options('/options-test', () => new NextResponse('OPTIONS response'));

    const methods = [
      { method: 'GET', path: '/get-test', expected: 'GET response' },
      { method: 'POST', path: '/post-test', expected: 'POST response' },
      { method: 'PUT', path: '/put-test', expected: 'PUT response' },
      { method: 'DELETE', path: '/delete-test', expected: 'DELETE response' },
      { method: 'PATCH', path: '/patch-test', expected: 'PATCH response' },
      {
        method: 'OPTIONS',
        path: '/options-test',
        expected: 'OPTIONS response',
      },
    ];

    for (const { method, path, expected } of methods) {
      const req = new NextRequest(new URL(`http://localhost${path}`), {
        method,
      });
      const handler = router.handlers[method as keyof typeof router.handlers]!;
      const response = await handler(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe(expected);
    }
  });

  it('should handle afterResponse hook', async () => {
    const router = new OpenAPIRouter();
    const afterResponseCalled = vi.fn();

    router.afterResponse((args, response) => {
      afterResponseCalled(args.req.method, response.status);
    });

    router.get('/test', () => new NextResponse('success', { status: 201 }));

    const req = new NextRequest(new URL('http://localhost/test'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

    expect(response.status).toBe(201);
    expect(await response.text()).toBe('success');
    expect(afterResponseCalled).toHaveBeenCalledWith('GET', 201);
  });

  it('should handle onError hook that returns a response', async () => {
    const router = new OpenAPIRouter();
    const errorHandlerCalled = vi.fn();

    router.onError((_args, error) => {
      errorHandlerCalled(error);
      if (error instanceof Error && error.message === 'Test error') {
        return NextResponse.json({ error: 'Handled error' }, { status: 400 });
      }
    });

    router.get('/error', () => {
      throw new Error('Test error');
    });

    const req = new NextRequest(new URL('http://localhost/error'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Handled error' });
    expect(errorHandlerCalled).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should handle onError hook that does not return a response', async () => {
    const router = new OpenAPIRouter();
    const errorHandlerCalled = vi.fn();

    router.onError((_args, error) => {
      errorHandlerCalled(error);
      // This error handler doesn't return a response, so error should be re-thrown
    });

    router.get('/error', () => {
      throw new Error('Unhandled error');
    });

    const req = new NextRequest(new URL('http://localhost/error'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;

    await expect(handler(req)).rejects.toThrow('Unhandled error');
    expect(errorHandlerCalled).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should handle multiple onError hooks with first one returning response', async () => {
    const router = new OpenAPIRouter();
    const firstErrorHandler = vi.fn();
    const secondErrorHandler = vi.fn();

    router.onError((_args, error) => {
      firstErrorHandler(error);
      return NextResponse.json({ error: 'First handler' }, { status: 500 });
    });

    router.onError((_args, error) => {
      secondErrorHandler(error);
      return NextResponse.json({ error: 'Second handler' }, { status: 400 });
    });

    router.get('/error', () => {
      throw new Error('Test error');
    });

    const req = new NextRequest(new URL('http://localhost/error'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'First handler' });
    expect(firstErrorHandler).toHaveBeenCalled();
    expect(secondErrorHandler).not.toHaveBeenCalled(); // Should not be called since first handler returned response
  });

  it('should handle afterResponse hook that throws an error', async () => {
    const router = new OpenAPIRouter();
    const errorHandlerCalled = vi.fn();

    router.afterResponse(() => {
      throw new Error('AfterResponse error');
    });

    router.onError((_args, error) => {
      errorHandlerCalled(error);
      return NextResponse.json(
        { error: 'Handled afterResponse error' },
        { status: 500 },
      );
    });

    router.get('/test', () => new NextResponse('success'));

    const req = new NextRequest(new URL('http://localhost/test'), {
      method: 'GET',
    });
    const handler = router.handlers.GET!;
    const response = await handler(req);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Handled afterResponse error',
    });
    expect(errorHandlerCalled).toHaveBeenCalledWith(expect.any(Error));
  });
});
