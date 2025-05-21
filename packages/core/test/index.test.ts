import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  Input,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  RouteConfig,
  CoreOpenApiRouter,
  mergePath,
} from '../src/index';
import type { Context, ValidationTargets } from '../src/type';

// Create a mock implementation of CoreOpenApiRouter for testing
class TestCoreOpenAPIRouter extends CoreOpenApiRouter<any, any> {
  doc<P extends string>(path: P, _configure: OpenAPIObjectConfigV31): void {
    // Mock implementation
    this.openAPIRegistry.registerPath({
      method: 'get',
      path,
      responses: {
        200: {
          description: 'Success response',
        },
      },
    });
  }

  // Expose protected methods for testing
  getRoutingPath<P extends string>(path: P): string {
    return CoreOpenApiRouter.getRoutingPath(path);
  }

  route<
    R extends RouteConfig,
    I extends Input = InputTypeParam<R> &
      InputTypeQuery<R> &
      InputTypeHeader<R> &
      InputTypeCookie<R> &
      InputTypeForm<R> &
      InputTypeJson<R>,
  >(route: R): (c: Context<any>) => Promise<Context<any, I>> {
    return this._route(route);
  }

  validate(target: keyof ValidationTargets, schema: z.ZodSchema) {
    return this.zValidator(target, schema);
  }

  // Expose protected _registerRouter for testing
  publicRegisterRouter(pathForOpenAPI: string, router: CoreOpenApiRouter<any>) {
    this._registerRouter(pathForOpenAPI, router);
  }
}

describe('OpenApiRouter', () => {
  let router: TestCoreOpenAPIRouter;

  beforeEach(() => {
    router = new TestCoreOpenAPIRouter();
  });

  describe('getRoutingPath', () => {
    it('should convert OpenAPI path params to framework path params', () => {
      expect(router.getRoutingPath('/users/{id}')).toBe('/users/:id');
      expect(router.getRoutingPath('/users/{userId}/posts/{postId}')).toBe(
        '/users/:userId/posts/:postId',
      );
      expect(router.getRoutingPath('/plain/path')).toBe('/plain/path');
    });
  });

  describe('createRoute', () => {
    it('should create a route with utility methods', () => {
      const route = CoreOpenApiRouter.createRoute({
        method: 'get',
        path: '/users/{id}',
        responses: {
          200: {
            description: 'Success',
          },
        },
      });

      expect(route.method).toBe('get');
      expect(route.path).toBe('/users/{id}');
      expect(typeof route.getRoutingPath).toBe('function');
      expect(route.getRoutingPath()).toBe('/users/:id');
    });
  });

  describe('getOpenAPIDocument', () => {
    it('should generate an OpenAPI document from registered routes', () => {
      // Using an empty object for the second parameter, actual properties are handled in the mock
      router.doc('/users', {} as OpenAPIObjectConfigV31);

      const document = router.getOpenAPIDocument({
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      });

      expect(document).toHaveProperty('openapi');
      expect(document).toHaveProperty('info');
      expect(document).toHaveProperty('paths');
      expect(document.paths).toHaveProperty('/users');
      if (document.paths) {
        expect(document.paths['/users']).toHaveProperty('get');
      }
    });
  });

  // Add tests for the _route method
  describe('_route', () => {
    it('should register route with OpenAPI and create validators', () => {
      // Spy on openAPIRegistry.registerPath
      const registerPathSpy = vi.spyOn(router.openAPIRegistry, 'registerPath');

      // Create a route with various schema validations
      const route = CoreOpenApiRouter.createRoute({
        method: 'post',
        path: '/users',
        request: {
          query: z.object({ search: z.string().optional() }),
          params: z.object({ id: z.string().optional() }),
          headers: z.object({ 'content-type': z.string() }),
          cookies: z.object({ session: z.string().optional() }),
          body: {
            content: {
              'application/json': {
                schema: z.object({ name: z.string() }),
              },
            },
          },
        },
        responses: {
          200: { description: 'Success' },
        },
      });

      // Call the route method
      router.route(route);

      // Verify it registered the path
      expect(registerPathSpy).toHaveBeenCalledWith(route);
    });

    it('should implement the route validations for json body', async () => {
      const route = CoreOpenApiRouter.createRoute({
        method: 'post',
        path: '/users',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({ name: z.string() }),
              },
            },
          },
        },
        responses: {
          200: { description: 'Success' },
        },
      });

      const handler = router.route(route);
      const context = {
        req: {
          json: { name: 'Test User' },
          headers: { 'content-type': 'application/json' },
        },
        input: {} as any,
      };

      await handler(context);
      expect(context.input).toHaveProperty('json');
      expect(context.input.json).toEqual({ name: 'Test User' });
    });

    it('should implement the route validations for form data', async () => {
      const route = CoreOpenApiRouter.createRoute({
        method: 'post',
        path: '/users',
        request: {
          body: {
            content: {
              'multipart/form-data': {
                schema: z.object({ name: z.string() }),
              },
            },
          },
        },
        responses: {
          200: { description: 'Success' },
        },
      });

      const handler = router.route(route);
      const context = {
        req: {
          form: { name: 'Test User' },
          headers: { 'content-type': 'multipart/form-data' },
        },
        input: {} as any,
      };

      await handler(context);
      expect(context.input).toHaveProperty('form');
      expect(context.input.form).toEqual({ name: 'Test User' });
    });

    it('should implement the route validations for query params', async () => {
      const route = CoreOpenApiRouter.createRoute({
        method: 'get',
        path: '/users',
        request: {
          query: z.object({ search: z.string().optional() }),
        },
        responses: {
          200: { description: 'Success' },
        },
      });

      const handler = router.route(route);
      const context = {
        req: { query: { search: 'test' } },
        input: {} as any,
      };

      await handler(context);
      expect(context.input).toHaveProperty('query');
      expect(context.input.query).toEqual({ search: 'test' });
    });
  });

  // Add tests for zValidator with different targets
  describe('zValidator', () => {
    it('should validate query parameters', async () => {
      const schema = z.object({ id: z.string() });
      const validator = router.validate('query', schema);

      const context = {
        req: { query: { id: '123' } },
        input: {} as any,
      };

      await validator(context);
      expect(context.input).toHaveProperty('query');
      expect(context.input.query).toEqual({ id: '123' });
    });

    it('should validate JSON body', async () => {
      const schema = z.object({ name: z.string() });
      const validator = router.validate('json', schema);

      const context = {
        req: {
          json: { name: 'Test User' },
          headers: { 'content-type': 'application/json' },
        },
        input: {} as any,
      };

      await validator(context);

      expect(context.input).toHaveProperty('json');
      expect(context.input.json).toEqual({ name: 'Test User' });
    });

    it('should validate form data', async () => {
      const schema = z.object({ email: z.string().email() });
      const validator = router.validate('form', schema);

      const context = {
        req: {
          form: { email: 'user@example.com' },
          headers: { 'content-type': 'multipart/form-data' },
        },
        input: {} as any,
      };

      await validator(context);
      expect(context.input).toHaveProperty('form');
      expect(context.input.form).toEqual({ email: 'user@example.com' });
    });

    it('should validate text body', async () => {
      const schema = z.string();
      const validator = router.validate('text', schema);

      const context = {
        req: { body: 'plain text content' },
        input: {} as any,
      };

      await validator(context);
      expect(context.input).toHaveProperty('text');
      expect(context.input.text).toEqual('plain text content');
    });

    it('should validate headers', async () => {
      const schema = z.object({ 'api-key': z.string() });
      const validator = router.validate('header', schema);

      const context = {
        req: { headers: { 'api-key': 'secret-key' } },
        input: {} as any,
      };

      await validator(context);
      expect(context.input).toHaveProperty('header');
      expect(context.input.header).toEqual({ 'api-key': 'secret-key' });
    });

    it('should validate cookies', async () => {
      const schema = z.object({ session: z.string() });
      const validator = router.validate('cookie', schema);

      const context = {
        req: { cookies: { session: 'abc123' } },
        input: {} as any,
      };

      await validator(context);
      expect(context.input).toHaveProperty('cookie');
      expect(context.input.cookie).toEqual({ session: 'abc123' });
    });

    it("should create input object if it doesn't exist", async () => {
      const schema = z.object({ id: z.string() });
      const validator = router.validate('param', schema);

      const context = {
        req: { params: { id: '123' } },
        input: {} as any,
      };

      await validator(context);
      expect(context).toHaveProperty('input');
      expect(context.input).toHaveProperty('param');
      expect(context.input.param).toEqual({ id: '123' });
    });
  });

  describe('_registerRouter', () => {
    let parentRouter: TestCoreOpenAPIRouter;
    let childRouter: TestCoreOpenAPIRouter;

    beforeEach(() => {
      parentRouter = new TestCoreOpenAPIRouter();
      childRouter = new TestCoreOpenAPIRouter();
    });

    it('should register components from child router', () => {
      const component = z.object({ id: z.string() }).openapi('User');
      childRouter.openAPIRegistry.registerComponent(
        'schemas',
        'User',
        component as any,
      );

      const registerComponentSpy = vi.spyOn(
        parentRouter.openAPIRegistry,
        'registerComponent',
      );
      parentRouter.publicRegisterRouter('/api', childRouter);

      expect(registerComponentSpy).toHaveBeenCalledTimes(1);
      expect(registerComponentSpy).toHaveBeenCalledWith(
        'schemas',
        'User',
        component,
      );
    });

    it('should register schemas from child router', () => {
      const schema = z.string().openapi('TestString');
      childRouter.openAPIRegistry.register('TestString', schema);

      const registerSpy = vi.spyOn(parentRouter.openAPIRegistry, 'register');
      parentRouter.publicRegisterRouter('/api', childRouter);

      expect(registerSpy).toHaveBeenCalledTimes(1);
      expect(registerSpy.mock.calls[0][0]).toBe('TestString');
    });

    it('should register parameters from child router', () => {
      const parameter = z
        .string()
        .openapi('TestParam', { param: { name: 'myParam', in: 'query' } });
      childRouter.openAPIRegistry.registerParameter(
        'TestParam',
        parameter as any,
      );

      const registerParameterSpy = vi.spyOn(
        parentRouter.openAPIRegistry,
        'registerParameter',
      );
      parentRouter.publicRegisterRouter('/api', childRouter);

      expect(registerParameterSpy).toHaveBeenCalledTimes(1);
      expect(registerParameterSpy.mock.calls[0][0]).toBe('TestParam');
    });

    it('should register webhooks from child router with prefixed paths', () => {
      const webhookConfig = {
        method: 'post',
        path: '/hook',
        responses: { 200: { description: 'OK' } },
      } as RouteConfig; // Cast as RouteConfig for simplicity, actual type is WebhookConfig
      childRouter.openAPIRegistry.registerWebhook(webhookConfig as any);

      const registerWebhookSpy = vi.spyOn(
        parentRouter.openAPIRegistry,
        'registerWebhook',
      );
      parentRouter.publicRegisterRouter('/api', childRouter);

      expect(registerWebhookSpy).toHaveBeenCalledTimes(1);
      expect(registerWebhookSpy).toHaveBeenCalledWith({
        ...webhookConfig,
        path: '/api/hook',
      });
    });

    it('should handle various definition types from child router', () => {
      // Route
      const routeConfig = CoreOpenApiRouter.createRoute({
        method: 'get',
        path: '/items',
        responses: { 200: { description: 'OK' } },
      });
      childRouter.openAPIRegistry.registerPath(routeConfig);

      // Component
      const component = z.object({ name: z.string() }).openapi('Item');
      childRouter.openAPIRegistry.registerComponent(
        'schemas',
        'Item',
        component as any,
      );

      // Schema
      const schema = z.number().openapi('ItemCount');
      childRouter.openAPIRegistry.register('ItemCount', schema);

      // Parameter
      const parameter = z
        .string()
        .openapi('ItemID', { param: { name: 'itemId', in: 'path' } });
      childRouter.openAPIRegistry.registerParameter('ItemID', parameter as any);

      // Webhook
      const webhookConfig = {
        method: 'post',
        path: '/item-event',
        responses: { 200: { description: 'OK' } },
      } as RouteConfig;
      childRouter.openAPIRegistry.registerWebhook(webhookConfig as any);

      const registerPathSpy = vi.spyOn(
        parentRouter.openAPIRegistry,
        'registerPath',
      );
      const registerComponentSpy = vi.spyOn(
        parentRouter.openAPIRegistry,
        'registerComponent',
      );
      const registerSpy = vi.spyOn(parentRouter.openAPIRegistry, 'register');
      const registerParameterSpy = vi.spyOn(
        parentRouter.openAPIRegistry,
        'registerParameter',
      );
      const registerWebhookSpy = vi.spyOn(
        parentRouter.openAPIRegistry,
        'registerWebhook',
      );

      parentRouter.publicRegisterRouter('/v2', childRouter);

      expect(registerPathSpy).toHaveBeenCalledWith({
        ...routeConfig,
        path: '/v2/items',
      });
      expect(registerComponentSpy).toHaveBeenCalledWith(
        'schemas',
        'Item',
        expect.any(Object),
      );
      expect(registerSpy.mock.calls[0][0]).toBe('ItemCount');
      expect(registerParameterSpy.mock.calls[0][0]).toBe('ItemID');
      expect(registerWebhookSpy).toHaveBeenCalledWith({
        ...webhookConfig,
        path: '/v2/item-event',
      });
    });
  });
});

describe('mergePath', () => {
  it('should correctly merge path segments', () => {
    expect(mergePath('/api', '/users')).toBe('/api/users');
    expect(mergePath('/api/', '/users')).toBe('/api/users');
    expect(mergePath('/api', 'users')).toBe('/api/users');
    expect(mergePath('/api/', 'users')).toBe('/api/users');
    expect(mergePath('api', 'users')).toBe('/api/users');
  });

  it('should handle multiple path segments', () => {
    expect(mergePath('/api', 'users', 'profile')).toBe('/api/users/profile');
    expect(mergePath('/api/', '/users/', '/profile/')).toBe(
      '/api/users/profile/',
    );
  });

  it('should handle empty segments', () => {
    expect(mergePath('/api', '')).toBe('/api');
    expect(mergePath('/api', '', 'users')).toBe('/api/users');
  });
});
