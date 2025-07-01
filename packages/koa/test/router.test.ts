import Koa from 'koa';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createRoute, OpenAPIRouter, z } from '../src';
import { ZodError } from 'zod';
import bodyParser from '@koa/bodyparser';

describe('OpenAPIRouter', () => {
  it('should create an instance', () => {
    const router = new OpenAPIRouter();
    expect(router).toBeInstanceOf(OpenAPIRouter);
  });

  it('should handle a simple GET route', async () => {
    const app = new Koa();
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
      (ctx) => {
        ctx.h.json({ data: { message: 'world' }, status: 200 });
      },
    );

    router.registerApp(app);

    const response = await request(app.callback()).get('/hello');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'world' });
  });

  it('should apply middleware', async () => {
    const app = new Koa();
    const router = new OpenAPIRouter<{ user?: string }>();

    router.middleware(async (ctx, next) => {
      ctx.state.user = 'test-user';
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
      (ctx) => {
        ctx.h.json({ data: { user: ctx.state.user }, status: 200 });
      },
    );

    router.registerApp(app);

    const response = await request(app.callback()).get('/user');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: 'test-user' });
  });

  it('should handle route parameters', async () => {
    const app = new Koa();
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
      (ctx) => {
        ctx.h.json({ data: { itemId: ctx.input.param.id }, status: 200 });
      },
    );

    router.registerApp(app);

    const response = await request(app.callback()).get('/items/123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ itemId: '123' });
  });

  it('should handle query parameters', async () => {
    const app = new Koa();
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
      (ctx) => {
        ctx.h.json({ data: { query: ctx.input.query.q }, status: 200 });
      },
    );

    router.registerApp(app);

    const response = await request(app.callback()).get('/search?q=test');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ query: 'test' });
  });

  it('should handle JSON body', async () => {
    const app = new Koa();

    app.use(bodyParser());

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

    router.route(route, (ctx) => {
      console.log({ INPUT: ctx.input });
      return ctx.h.json({ data: ctx.input.json, status: 201 });
    });

    router.registerApp(app);

    const userData = { name: 'John Doe', age: 30 };
    const response = await request(app.callback())
      .post('/users')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(userData);
  });

  it('should handle cookies', async () => {
    const app = new Koa();
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

    router.route(route, (ctx) => {
      return ctx.h.json({ data: ctx.input.cookie, status: 200 });
    });

    router.registerApp(app);

    const response = await request(app.callback())
      .get('/profile')
      .set('Cookie', ['sessionId=abc123', 'userId=user456']);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      sessionId: 'abc123',
      userId: 'user456',
    });
  });

  it('should return validation error for invalid params', async () => {
    const app = new Koa();
    const router = new OpenAPIRouter();

    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        if (err instanceof ZodError) {
          ctx.status = 400;
          ctx.body = {
            status: 400,
            errors: {
              body: err.flatten().fieldErrors,
            },
          };
          return;
        }
      }
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
      (ctx) => {
        ctx.h.json({ data: { itemId: ctx.input.param.id }, status: 200 });
      },
    );

    router.registerApp(app);

    const response = await request(app.callback()).get('/items/abc');

    expect(response.status).toBe(400);
  });

  it('should validate response', async () => {
    const app = new Koa();
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
      (ctx) => {
        // @ts-expect-error - want to test validation error
        ctx.h.json({ data: { message: 123 }, status: 200 });
      },
    );

    router.registerApp(app);

    const response = await request(app.callback()).get('/test');

    expect(response.status).toBe(500);
  });

  it('should not validate reponse when validateResponse is false', async () => {
    const app = new Koa();
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
      (ctx) => {
        // @ts-expect-error - want to test validation error
        ctx.h.json({ data: { message: 123 }, status: 200 });
      },
    );
    router.registerApp(app);

    const response = await request(app.callback()).get('/test');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 123 });
  });

  it('extends the router should have the same middleware and options', async () => {
    const app = new Koa();
    const router = new OpenAPIRouter();

    const middleware = vi.fn(async (_, next) => {
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
      (ctx) => {
        ctx.h.text({ data: 'test', status: 200 });
      },
    );

    extendedRouter.registerApp(app);

    await request(app.callback()).get('/test');

    expect(extendedRouter).toBeInstanceOf(OpenAPIRouter);
    expect(extendedRouter).not.toBe(router);
    expect(middleware).toHaveBeenCalled();
  });

  it('should handle nested router correctly using router.use', async () => {
    const app = new Koa();
    const router = new OpenAPIRouter();

    const childRouter = new OpenAPIRouter();

    childRouter.route(
      createRoute({
        method: 'get',
        path: '/hello',
        getRoutingPath: () => '/hello',
        responses: { 200: { description: 'Success' } },
      }),
      (ctx) => {
        ctx.h.json({ data: { message: 'world' }, status: 200 });
      },
    );

    router.use('/api', childRouter);
    router.registerApp(app);

    const response = await request(app.callback()).get('/api/hello');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'world' });
  });

  it('should generate openapi doc', async () => {
    const app = new Koa();
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
      (ctx) => {
        ctx.h.json({ data: { message: 'test' }, status: 200 });
      },
    );
    router.doc('/api', {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
    });

    router.registerApp(app);

    const res = await request(app.callback()).get('/api');

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
