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
  RouteFactory,
  mergePath,
} from '../src/index';
import type { Context } from '../src/type';

// Create a mock implementation of RouteFactory for testing
class TestRouteFactory extends RouteFactory<any, any> {
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
    return RouteFactory.getRoutingPath(path);
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

  validate(target: any, schema: z.ZodSchema) {
    return this.zValidator(target, schema);
  }
}

describe('RouteFactory', () => {
  let factory: TestRouteFactory;

  beforeEach(() => {
    factory = new TestRouteFactory();
  });

  describe('getRoutingPath', () => {
    it('should convert OpenAPI path params to framework path params', () => {
      expect(factory.getRoutingPath('/users/{id}')).toBe('/users/:id');
      expect(factory.getRoutingPath('/users/{userId}/posts/{postId}')).toBe(
        '/users/:userId/posts/:postId',
      );
      expect(factory.getRoutingPath('/plain/path')).toBe('/plain/path');
    });
  });

  describe('createRoute', () => {
    it('should create a route with utility methods', () => {
      const route = RouteFactory.createRoute({
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
      factory.doc('/users', {} as OpenAPIObjectConfigV31);

      const document = factory.getOpenAPIDocument({
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
      const registerPathSpy = vi.spyOn(factory.openAPIRegistry, 'registerPath');

      // Create a route with various schema validations
      const route = RouteFactory.createRoute({
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
      factory.route(route);

      // Verify it registered the path
      expect(registerPathSpy).toHaveBeenCalledWith(route);
    });

    it('should implement the route validations for json body', async () => {
      const route = RouteFactory.createRoute({
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

      const handler = factory.route(route);
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
      const route = RouteFactory.createRoute({
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

      const handler = factory.route(route);
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
      const route = RouteFactory.createRoute({
        method: 'get',
        path: '/users',
        request: {
          query: z.object({ search: z.string().optional() }),
        },
        responses: {
          200: { description: 'Success' },
        },
      });

      const handler = factory.route(route);
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
    it('should validate query parameters', () => {
      const schema = z.object({ id: z.string() });
      const validator = factory.validate('query', schema);

      const context = {
        req: { query: { id: '123' } },
        input: {} as any,
      };

      validator(context);
      expect(context.input).toHaveProperty('query');
      expect(context.input.query).toEqual({ id: '123' });
    });

    it('should validate JSON body', () => {
      const schema = z.object({ name: z.string() });
      const validator = factory.validate('json', schema);

      const context = {
        req: {
          json: { name: 'Test User' },
          headers: { 'content-type': 'application/json' },
        },
        input: {} as any,
      };

      validator(context);
      expect(context.input).toHaveProperty('json');
      expect(context.input.json).toEqual({ name: 'Test User' });
    });

    it('should validate form data', () => {
      const schema = z.object({ email: z.string().email() });
      const validator = factory.validate('form', schema);

      const context = {
        req: {
          form: { email: 'user@example.com' },
          headers: { 'content-type': 'multipart/form-data' },
        },
        input: {} as any,
      };

      validator(context);
      expect(context.input).toHaveProperty('form');
      expect(context.input.form).toEqual({ email: 'user@example.com' });
    });

    it('should validate text body', () => {
      const schema = z.string();
      const validator = factory.validate('text', schema);

      const context = {
        req: { body: 'plain text content' },
        input: {} as any,
      };

      validator(context);
      expect(context.input).toHaveProperty('text');
      expect(context.input.text).toEqual('plain text content');
    });

    it('should validate headers', () => {
      const schema = z.object({ 'api-key': z.string() });
      const validator = factory.validate('header', schema);

      const context = {
        req: { headers: { 'api-key': 'secret-key' } },
        input: {} as any,
      };

      validator(context);
      expect(context.input).toHaveProperty('headers');
      expect(context.input.headers).toEqual({ 'api-key': 'secret-key' });
    });

    it('should validate cookies', () => {
      const schema = z.object({ session: z.string() });
      const validator = factory.validate('cookie', schema);

      const context = {
        req: { cookies: { session: 'abc123' } },
        input: {} as any,
      };

      validator(context);
      expect(context.input).toHaveProperty('cookies');
      expect(context.input.cookies).toEqual({ session: 'abc123' });
    });

    it("should create input object if it doesn't exist", () => {
      const schema = z.object({ id: z.string() });
      const validator = factory.validate('param', schema);

      const context = {
        req: { params: { id: '123' } },
        input: {} as any,
      };

      validator(context);
      expect(context).toHaveProperty('input');
      expect(context.input).toHaveProperty('params');
      expect(context.input.params).toEqual({ id: '123' });
    });
  });

  // Add tests for addBasePathToDocument
  describe('addBasePathToDocument', () => {
    it('should add base path to all routes in the document', () => {
      // Create a document with some paths
      factory.doc('/users', {} as OpenAPIObjectConfigV31);
      factory.doc('/products', {} as OpenAPIObjectConfigV31);

      const document = factory.getOpenAPIDocument({
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      });

      // Add base path to the document
      const basePath = '/api/v1';
      const updatedDoc = factory.addBasePathToDocument(document, basePath);

      // Check that paths have been updated
      expect(updatedDoc.paths).not.toHaveProperty('/users');
      expect(updatedDoc.paths).not.toHaveProperty('/products');
      expect(updatedDoc.paths).toHaveProperty('/api/v1/users');
      expect(updatedDoc.paths).toHaveProperty('/api/v1/products');
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
