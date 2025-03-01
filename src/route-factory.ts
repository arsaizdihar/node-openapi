import {
  OpenAPIRegistry,
  ZodMediaTypeObject,
} from '@asteasolutions/zod-to-openapi';
import { z, ZodSchema, ZodType } from 'zod';
import type { Request } from './request';
import {
  ConvertPathType,
  Handler,
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
  RouteConfigToHandlerResponse,
  RoutingPath,
  ValidationTargets,
} from './utils/type';

export class RouteFactory<Req extends Request> {
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

  route<
    R extends RouteConfig,
    I extends Input = InputTypeParam<R> &
      InputTypeQuery<R> &
      InputTypeHeader<R> &
      InputTypeCookie<R> &
      InputTypeForm<R> &
      InputTypeJson<R>,
    P extends string = ConvertPathType<R['path']>,
  >(
    route: R,
    handler: Handler<Req, P, I, RouteConfigToHandlerResponse<R>>,
  ): Handler<Req, P, I, RouteConfigToHandlerResponse<R>> {
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

      return handler(c);
    };
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
      if (target === 'query') {
        const result = schema.safeParse(c.req.query);

        if (!result.success) {
          throw new Error('Validation failed');
        }

        return result.data;
      }
    };
  }
}
