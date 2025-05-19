import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Context,
  Input,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  MaybePromise,
  Prettify,
  RouteConfig,
  RouteConfigToHandlerResponse,
  RouteFactory,
  z,
  OpenAPIDefinitions,
  CoreRoute,
} from '@node-openapi/core';
import { NextRequest, NextResponse } from 'next/server';
import { NextHandler, NextRouteContext } from './helper';
import { NextRequestAdapter } from './request';
export { z };
export type { OpenAPIDefinitions, RouteConfig };

type NextMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD';

const nextMethods: NextMethod[] = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS',
  'HEAD',
];

export class NextRouteFactory<
  TContext extends Record<string, unknown> = Record<string, unknown>,
  TRoutes extends Record<string, RouteConfig | undefined> = {},
> extends RouteFactory<NextRequestAdapter> {
  private _routes: TRoutes = {} as TRoutes;
  private _coreRoutes: Record<NextMethod, CoreRoute | undefined> = {} as Record<
    NextMethod,
    CoreRoute | undefined
  >;

  private _handlers: Record<NextMethod, NextHandler<any, any> | undefined> = {
    GET: undefined,
    POST: undefined,
    PUT: undefined,
    DELETE: undefined,
    PATCH: undefined,
    OPTIONS: undefined,
    HEAD: undefined,
  };

  private _middlewares: ((
    req: NextRequest,
    ctx: NextRouteContext & TContext,
  ) => MaybePromise<void>)[] = [];

  constructor() {
    super();
  }

  extend<NewContext extends Record<string, unknown>>(): NextRouteFactory<
    TContext & NewContext
  > {
    const factory = new NextRouteFactory<TContext & NewContext>();
    factory._handlers = { ...this._handlers };
    factory._middlewares = [...this._middlewares];
    return factory;
  }

  doc<P extends string>(
    _path: P,
    configure: OpenAPIObjectConfigV31,
  ): NextHandler<ReturnType<OpenApiGeneratorV31['generateDocument']>> {
    return async () => {
      const document = this.getOpenAPIDocument(configure);
      return NextResponse.json(document);
    };
  }

  middleware(
    middleware: (
      req: NextRequest,
      ctx: NextRouteContext & TContext,
    ) => MaybePromise<void>,
  ) {
    this._middlewares.push(middleware);
    return this;
  }

  merge(...routeFactories: NextRouteFactory[]) {
    for (const routeFactory of routeFactories) {
      for (const [method, handler] of Object.entries(routeFactory._handlers)) {
        if (handler) {
          this._handlers[method as NextMethod] = handler;
        }
      }
      routeFactory._middlewares.push(...(this._middlewares as any));
    }
    return this.router(...routeFactories);
  }

  router(...routeFactories: NextRouteFactory[]) {
    for (const routeFactory of routeFactories) {
      this._registerRouter('/', routeFactory);
    }
    return this;
  }

  route<R extends RouteConfig>(
    route: R,
  ): NextRouteFactory<
    TContext,
    {
      [K in keyof TRoutes | Uppercase<R['method']>]: K extends Uppercase<
        R['method']
      >
        ? R
        : TRoutes[K];
    }
  > {
    const method = route.method.toUpperCase();

    if (!nextMethods.includes(method as NextMethod)) {
      throw new Error(`Invalid method: ${method}`);
    }

    // @ts-expect-error we will augment the type with the return
    this._routes[method as NextMethod] = route;
    this._coreRoutes[method as NextMethod] = this._route(
      route,
    ) as unknown as CoreRoute;
    return this as any;
  }

  handler<
    Method extends keyof TRoutes,
    R extends RouteConfig = TRoutes[Method] extends RouteConfig
      ? TRoutes[Method]
      : never,
    I extends Input = InputTypeParam<R> &
      InputTypeQuery<R> &
      InputTypeHeader<R> &
      InputTypeCookie<R> &
      InputTypeForm<R> &
      InputTypeJson<R>,
  >(
    method: Method,
    handler: NextHandler<
      'data' extends keyof RouteConfigToHandlerResponse<R>
        ? RouteConfigToHandlerResponse<R>['data']
        : any,
      NextRouteContext<
        'params' extends keyof I['out'] ? I['out']['params'] : any
      > & {
        input: Prettify<I['out']>;
      } & TContext
    >,
  ) {
    const _route = this._coreRoutes[method as NextMethod];

    if (!_route) {
      throw new Error(`Route for method ${method.toString()} not found`);
    }

    const finalHandler = async (
      req: NextRequest,
      ctx: NextRouteContext & TContext,
    ) => {
      for (const middleware of this._middlewares) {
        await middleware(req, ctx);
      }
      const context: Context<NextRequestAdapter> = {
        req: new NextRequestAdapter(req, ctx.params),
        input: {},
      };
      const c = await _route(context);
      const input = c.input as any;

      const nextCtx = {
        ...ctx,
        input,
      };

      return handler(req, nextCtx as any);
    };

    this._handlers[method as NextMethod] = finalHandler;

    return this;
  }

  get handlers(): Readonly<Record<NextMethod, NextHandler | undefined>> {
    return this._handlers;
  }
}

export const { createRoute } = NextRouteFactory;
