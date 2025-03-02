import {
  OpenApiGeneratorV31,
  OpenAPIRegistry,
  ZodMediaTypeObject,
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
  RoutingPath,
  ValidationTargets,
} from './type';
import { OpenAPIObjectConfig } from '@asteasolutions/zod-to-openapi/dist/v3.0/openapi-generator';
import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
export * from './type';
export * from './status';
export * from './request';

export abstract class RouteFactory<Req extends RequestLike> {
  openAPIRegistry: OpenAPIRegistry;

  constructor() {
    this.openAPIRegistry = new OpenAPIRegistry();
  }

  createRoute<
    P extends string,
    R extends Omit<RouteConfig, 'path'> & { path: P },
  >(routeConfig: R) {
    const route = {
      ...routeConfig,
      getRoutingPath(): RoutingPath<R['path']> {
        return routeConfig.path.replaceAll(
          /\/{(.+?)}/g,
          '/:$1',
        ) as RoutingPath<P>;
      },
    };
    return Object.defineProperty(route, 'getRoutingPath', {
      enumerable: false,
    });
  }

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
      const schema = (bodyContent['application/json'] as ZodMediaTypeObject)[
        'schema'
      ];
      if (schema instanceof ZodType) {
        const validator = this.zValidator('json', schema);
        validators.push(validator as MiddlewareHandler<Req>);
      }
    }

    return async (c) => {
      for (const validator of validators) {
        await validator(c);
      }

      return c as Context<Req, I>;
    };
  }

  abstract doc<P extends string>(
    path: P,
    configure: OpenAPIObjectConfigV31,
  ): void;

  getOpenAPIDocument(
    config: OpenAPIObjectConfig,
  ): ReturnType<OpenApiGeneratorV31['generateDocument']> {
    const generator = new OpenApiGeneratorV31(this.openAPIRegistry.definitions);
    const document = generator.generateDocument(config);
    // TODO: add base path
    return document;
  }

  zValidator<
    T extends ZodSchema,
    Target extends keyof ValidationTargets,
    In = z.input<T>,
    Out = z.output<T>,
    I extends Input = {
      in: HasUndefined<In> extends true
        ? {
            [K in Target]?: In extends ValidationTargets[K]
              ? In
              : { [K2 in keyof In]?: ValidationTargets[K][K2] };
          }
        : {
            [K in Target]: In extends ValidationTargets[K]
              ? In
              : { [K2 in keyof In]: ValidationTargets[K][K2] };
          };
      out: { [K in Target]: Out };
    },
  >(target: Target, schema: T): MiddlewareHandler<Req, I> {
    return (c) => {
      if (!c.input) {
        c.input = {};
      }

      if (target === 'query') {
        const data = schema.parse(c.req.query);

        (c.input as any).query = data;
        return;
      }

      if (target === 'json') {
        const data = schema.parse(c.req.json);

        (c.input as any).json = data;
        return;
      }
    };
  }

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
  if (rest.length) {
    sub = mergePath(sub as string, ...rest);
  }
  return `${base?.[0] === '/' ? '' : '/'}${base}${
    sub === '/'
      ? ''
      : `${base?.at(-1) === '/' ? '' : '/'}${sub?.[0] === '/' ? sub.slice(1) : sub}`
  }`;
};
