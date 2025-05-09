/**
 * Core functionality for API route generation with OpenAPI integration.
 * Provides types, validation, and OpenAPI documentation utilities.
 */
import {
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import { z, ZodSchema, ZodType } from 'zod';
import type { RequestLike } from './request';
import {
  Context,
  HasUndefined,
  Input,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  MiddlewareHandler,
  RouteConfig,
  ValidationTargets,
} from './type';
import { OpenAPIObjectConfig } from '@asteasolutions/zod-to-openapi/dist/v3.0/openapi-generator';
import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import type { OpenAPIDefinitions } from '@asteasolutions/zod-to-openapi/dist/openapi-registry';
export * from './type';
export * from './status';
export * from './request';
export * from './json';

export { OpenAPIDefinitions };

extendZodWithOpenApi(z);

/**
 * Abstract base class for creating API routes with schema validation and OpenAPI documentation.
 * @template Req - Request type extending RequestLike
 * @template FormValueType - Type of form values for the framework
 */
export abstract class RouteFactory<
  Req extends RequestLike,
  FormValueType extends NonNullable<
    Req['form'][keyof Req['form']]
  > = NonNullable<Req['form'][keyof Req['form']]>,
> {
  openAPIRegistry: OpenAPIRegistry;

  constructor() {
    this.openAPIRegistry = new OpenAPIRegistry();
  }

  /**
   * Converts OpenAPI-style path params to framework-specific format
   * @example /users/{id} → /users/:id
   */
  protected static getRoutingPath<P extends string>(path: P) {
    return path.replaceAll(/\/{(.+?)}/g, '/:$1');
  }

  /**
   * Creates a route configuration with additional utility methods
   */
  static createRoute<R extends RouteConfig>(routeConfig: R) {
    const route = {
      ...routeConfig,
      getRoutingPath: () => RouteFactory.getRoutingPath(routeConfig.path),
    };
    return Object.defineProperty(route, 'getRoutingPath', {
      enumerable: false,
    });
  }

  /**
   * Creates middleware to validate requests against schemas defined in route config
   * Registers the route with OpenAPI documentation
   */
  protected _route<
    R extends RouteConfig,
    I extends Input = InputTypeParam<R> &
      InputTypeQuery<R> &
      InputTypeHeader<R> &
      InputTypeCookie<R> &
      InputTypeForm<R> &
      InputTypeJson<R>,
  >(route: R): (c: Context<Req>) => Promise<Context<Req, I>> {
    this.openAPIRegistry.registerPath(route);

    const validators: MiddlewareHandler<Req>[] = [];

    if (route.request?.query) {
      const validator = this.zValidator('query', route.request.query);
      validators.push(validator as MiddlewareHandler<Req>);
    }

    if (route.request?.params) {
      const validator = this.zValidator('param', route.request.params);
      validators.push(validator as MiddlewareHandler<Req>);
    }

    if (route.request?.headers) {
      const validator = this.zValidator('header', route.request.headers as any);
      validators.push(validator as MiddlewareHandler<Req>);
    }

    if (route.request?.cookies) {
      const validator = this.zValidator('cookie', route.request.cookies);
      validators.push(validator as MiddlewareHandler<Req>);
    }

    const bodyContent = route.request?.body?.content;

    if (bodyContent) {
      if (bodyContent['application/json']) {
        const schema = bodyContent['application/json']['schema'];
        if (schema instanceof ZodType) {
          const validator = this.zValidator('json', schema);
          validators.push(validator as MiddlewareHandler<Req>);
        }
      }

      if (bodyContent['multipart/form-data']) {
        const schema = bodyContent['multipart/form-data']['schema'];
        if (schema instanceof ZodType) {
          const validator = this.zValidator('form', schema);
          validators.push(validator as MiddlewareHandler<Req>);
        }
      }

      if (bodyContent['application/x-www-form-urlencoded']) {
        const schema =
          bodyContent['application/x-www-form-urlencoded']['schema'];
        if (schema instanceof ZodType) {
          const validator = this.zValidator('form', schema);
          validators.push(validator as MiddlewareHandler<Req>);
        }
      }

      if (bodyContent['text/plain']) {
        const schema = bodyContent['text/plain']['schema'];
        if (schema instanceof ZodType) {
          const validator = this.zValidator('text', schema);
          validators.push(validator as MiddlewareHandler<Req>);
        }
      }
    }

    return async (c) => {
      for (const validator of validators) {
        await validator(c);
      }

      return c as Context<Req, I>;
    };
  }

  /**
   * Generate OpenAPI documentation for a path
   * @abstract
   */
  abstract doc<P extends string>(
    path: P,
    configure: OpenAPIObjectConfigV31,
  ): void;

  /**
   * Generates a complete OpenAPI document based on registered routes
   */
  getOpenAPIDocument(
    config: OpenAPIObjectConfig,
    additionalDefinitions: OpenAPIDefinitions[] = [],
  ): ReturnType<OpenApiGeneratorV31['generateDocument']> {
    const generator = new OpenApiGeneratorV31([
      ...this.openAPIRegistry.definitions,
      ...additionalDefinitions,
    ]);
    const document = generator.generateDocument(config);
    // TODO: add base path
    return document;
  }

  /**
   * Creates a middleware that validates request data against a zod schema
   * @param target - Part of the request to validate (query, json, form, etc.)
   * @param schema - Zod schema to validate against
   * @returns Middleware handler that validates and adds parsed data to context
   */
  zValidator<
    T extends ZodSchema,
    Target extends keyof ValidationTargets<FormValueType>,
    In = z.input<T>,
    Out = z.output<T>,
    I extends Input = {
      in: HasUndefined<In> extends true
        ? {
            [K in Target]?: In extends ValidationTargets<FormValueType>[K]
              ? In
              : { [K2 in keyof In]?: ValidationTargets<FormValueType>[K][K2] };
          }
        : {
            [K in Target]: In extends ValidationTargets<FormValueType>[K]
              ? In
              : { [K2 in keyof In]: ValidationTargets<FormValueType>[K][K2] };
          };
      out: { [K in Target]: Out };
    },
  >(target: Target, schema: T): MiddlewareHandler<Req, I> {
    return async (c) => {
      if (!c.input) {
        c.input = {};
      }

      if (target === 'query') {
        const data = schema.parse(c.req.query);

        (c.input as any).query = data;
        return;
      }

      if (
        target === 'json' &&
        c.req.headers['content-type'] === 'application/json'
      ) {
        const data = schema.parse(await c.req.json);

        (c.input as any).json = data;
        return;
      }

      if (
        target === 'form' &&
        c.req.headers['content-type'] === 'multipart/form-data'
      ) {
        const data = schema.parse(await c.req.form);

        (c.input as any).form = data;
        return;
      }

      if (target === 'text') {
        const data = schema.parse(await c.req.body);

        (c.input as any).text = data;
        return;
      }

      if (target === 'header') {
        const data = schema.parse(c.req.headers);

        (c.input as any).header = data;
        return;
      }

      if (target === 'cookie') {
        const data = schema.parse(c.req.cookies);

        (c.input as any).cookie = data;
        return;
      }

      if (target === 'param') {
        const data = schema.parse(await c.req.params);

        (c.input as any).param = data;
        return;
      }
    };
  }

  /**
   * Adds a base path to all routes in an OpenAPI document
   * @param document - OpenAPI document to modify
   * @param basePath - Base path to add to all routes
   * @returns Updated OpenAPI document
   */
  addBasePathToDocument(document: Record<string, any>, basePath: string) {
    const updatedPaths: Record<string, any> = {};

    Object.keys(document.paths).forEach((path) => {
      updatedPaths[mergePath(basePath, path)] = document.paths[path];
    });

    return {
      ...document,
      paths: updatedPaths,
    };
  }

  /**
   * Register routes and components in the OpenAPI registry as a sub-router
   * @param pathForOpenAPI - The base path for the OpenAPI document
   * @param routeFactory - The route factory to register
   */
  protected _registerRouter(
    pathForOpenAPI: string,
    routeFactory: RouteFactory<Req>,
  ) {
    routeFactory.openAPIRegistry.definitions.forEach((def) => {
      switch (def.type) {
        case 'component':
          return this.openAPIRegistry.registerComponent(
            def.componentType,
            def.name,
            def.component,
          );

        case 'route':
          return this.openAPIRegistry.registerPath({
            ...def.route,
            path: mergePath(pathForOpenAPI, def.route.path),
          });

        case 'webhook':
          return this.openAPIRegistry.registerWebhook({
            ...def.webhook,
            path: mergePath(pathForOpenAPI, def.webhook.path),
          });

        case 'schema':
          return this.openAPIRegistry.register(
            def.schema._def.openapi._internal.refId,
            def.schema,
          );

        case 'parameter':
          return this.openAPIRegistry.registerParameter(
            def.schema._def.openapi._internal.refId,
            def.schema,
          );

        default: {
          const errorIfNotExhaustive: never = def;
          throw new Error(`Unknown registry type: ${errorIfNotExhaustive}`);
        }
      }
    });
  }
}

/**
 * Merge paths.
 * @param {string[]} ...paths - The paths to merge.
 * @returns {string} The merged path.
 * @example
 * mergePath('/api', '/users') // '/api/users'
 * mergePath('/api/', '/users') // '/api/users'
 * mergePath('/api', '/') // '/api'
 * mergePath('/api/', '/') // '/api/'
 */
export const mergePath: (...paths: string[]) => string = (
  base: string | undefined,
  sub: string | undefined,
  ...rest: string[]
): string => {
  const paths = [base, sub, ...rest].filter(Boolean);
  if (paths.length === 0) {
    return '';
  }

  let result = paths[0] || '';

  for (let i = 1; i < paths.length; i++) {
    const segment = paths[i] || '';
    if (result.endsWith('/')) {
      result = result + (segment.startsWith('/') ? segment.slice(1) : segment);
    } else {
      result = result + (segment.startsWith('/') ? segment : '/' + segment);
    }
  }

  if (!result.startsWith('/')) {
    result = '/' + result;
  }

  return result;
};

export type RecursiveArray<T> = Array<T | RecursiveArray<T>>;

export function flattenRecursiveArray<T>(array: RecursiveArray<T>): T[] {
  return array.reduce<T[]>((acc, item) => {
    if (Array.isArray(item)) {
      return acc.concat(flattenRecursiveArray(item));
    }

    return acc.concat(item);
  }, []);
}

export { z };
