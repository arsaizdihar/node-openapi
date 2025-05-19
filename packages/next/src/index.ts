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
  OpenAPIDefinitions,
  Prettify,
  RouteConfig,
  RouteConfigToHandlerResponse,
  RouteFactory,
  z,
} from '@node-openapi/core';
import { NextRequest, NextResponse } from 'next/server';
import { NextHandler } from './helper';
import { NextRequestAdapter } from './request';
import { RouteContext, Router, RouterMiddleware } from './router';
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
export class NextRouteFactory<
  TContext extends Record<string, unknown> = Record<string, unknown>,
> extends RouteFactory<NextRequestAdapter> {
  private _router = new Router();
  private _hooks = {
    afterResponse: [] as ((
      req: NextRequest,
      ctx: RouteContext<TContext>,
      response: NextResponse,
    ) => MaybePromise<void>)[],
  };

  constructor() {
    super();
  }

  extend<NewContext extends Record<string, unknown>>(): NextRouteFactory<
    TContext & NewContext
  > {
    const factory = new NextRouteFactory<TContext & NewContext>();
    factory._router = this._router.copy();
    return factory;
  }

  doc(path: string, configure: OpenAPIObjectConfigV31) {
    this._router.add('get', path, async () => {
      const document = this.getOpenAPIDocument(configure);
      return NextResponse.json(document);
    });
  }

  middleware(
    middleware: (
      req: NextRequest,
      ctx: RouteContext<TContext>,
    ) => MaybePromise<void>,
  ) {
    this._router.middleware(middleware as RouterMiddleware);
    return this;
  }

  router(path: string, routeFactory: NextRouteFactory) {
    this._router.use(path, routeFactory._router);
    this._registerRouter(path, routeFactory);
    return this;
  }

  route<
    R extends RouteConfig & { getRoutingPath: () => string },
    I extends Input = InputTypeParam<R> &
      InputTypeQuery<R> &
      InputTypeHeader<R> &
      InputTypeCookie<R> &
      InputTypeForm<R> &
      InputTypeJson<R>,
  >(
    route: R,
    handler: NextHandler<
      'data' extends keyof RouteConfigToHandlerResponse<R>
        ? RouteConfigToHandlerResponse<R>['data']
        : any,
      RouteContext<TContext, Prettify<I['out']>>
    >,
  ) {
    const _route = this._route(route);

    const finalHandler = async (
      req: NextRequest,
      ctx: RouteContext<TContext, Prettify<I['out']>>,
    ) => {
      const context: Context<NextRequestAdapter> = {
        req: new NextRequestAdapter(req, ctx.params),
        input: {},
      };
      const c = await _route(context);
      const input = c.input as any;

      ctx.input = input;

      const response = await handler(req, ctx);

      return response;
    };

    this._router.add(route.method, route.getRoutingPath(), finalHandler);

    return this;
  }

  get<T = any>(path: string, handler: NextHandler<T, RouteContext<TContext>>) {
    this._router.add('get', path, handler);
    return this;
  }

  post<T = any>(path: string, handler: NextHandler<T, RouteContext<TContext>>) {
    this._router.add('post', path, handler);
    return this;
  }

  put<T = any>(path: string, handler: NextHandler<T, RouteContext<TContext>>) {
    this._router.add('put', path, handler);
    return this;
  }

  delete<T = any>(
    path: string,
    handler: NextHandler<T, RouteContext<TContext>>,
  ) {
    this._router.add('delete', path, handler);
    return this;
  }

  patch<T = any>(
    path: string,
    handler: NextHandler<T, RouteContext<TContext>>,
  ) {
    this._router.add('patch', path, handler);
    return this;
  }

  options<T = any>(
    path: string,
    handler: NextHandler<T, RouteContext<TContext>>,
  ) {
    this._router.add('options', path, handler);
    return this;
  }

  afterResponse(
    middleware: (
      req: NextRequest,
      ctx: RouteContext<TContext>,
      response: NextResponse,
    ) => MaybePromise<void>,
  ) {
    this._hooks.afterResponse.push(middleware);
    return this;
  }

  get handlers(): Record<NextMethod, NextHandler | undefined> {
    const handler: NextHandler = async (req) => {
      const { response, context } = await this._router.dispatch(req);
      for (const hook of this._hooks.afterResponse) {
        await hook(req, context, response);
      }
      return response;
    };

    return {
      GET: handler,
      POST: handler,
      PUT: handler,
      DELETE: handler,
      PATCH: handler,
      OPTIONS: handler,
      HEAD: handler,
    };
  }
}

export const { createRoute } = NextRouteFactory;
