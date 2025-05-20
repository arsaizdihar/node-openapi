import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Context,
  HelperResponseArg,
  Input,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  MaybePromise,
  OpenAPIDefinitions,
  RouteConfig,
  RouteConfigToHandlerResponse,
  RouteFactory,
  z,
} from '@node-openapi/core';
import { NextRequest, NextResponse } from 'next/server';
import { NextRequestAdapter } from './request';
import { HandlerArgs, RouteHandler, Router, RouterMiddleware } from './router';
export { z };
export type { OpenAPIDefinitions, RouteConfig };

export type NextHelper<R extends RouteConfig> = {
  json: <Response extends HelperResponseArg<R, 'json'>>(
    response: Response,
  ) => NextResponse<Response['data']>;
  text: <Response extends HelperResponseArg<R, 'text', string>>(
    response: Response,
  ) => NextResponse<Response['data']>;
};

type NextHandler = (req: NextRequest) => MaybePromise<NextResponse>;

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
    afterResponse:
      Array<
        (
          args: HandlerArgs<TContext>,
          response: NextResponse,
        ) => MaybePromise<void>
      >(),
    error: [] as Array<
      (
        args: HandlerArgs<TContext>,
        error: unknown,
      ) => MaybePromise<void | NextResponse>
    >,
  };
  private _validateResponse: boolean;

  constructor(options: { validateResponse?: boolean } = {}) {
    super();
    this._validateResponse = options.validateResponse ?? true;
  }

  extend<NewContext extends Record<string, unknown>>(): NextRouteFactory<
    TContext & NewContext
  > {
    const factory = new NextRouteFactory<TContext & NewContext>({
      validateResponse: this._validateResponse,
    });
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
      args: HandlerArgs<TContext>,
    ) => MaybePromise<NextResponse | void>,
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
    handler: RouteHandler<
      TContext,
      { input: I['out']; h: NextHelper<R> },
      'data' extends keyof RouteConfigToHandlerResponse<R>
        ? RouteConfigToHandlerResponse<R>['data']
        : any
    >,
  ) {
    const _route = this._route(route);

    const finalHandler = async (args: HandlerArgs<TContext>) => {
      const context: Context<NextRequestAdapter> = {
        req: new NextRequestAdapter(args.req, args.params),
        input: {},
      };
      const c = await _route(context);
      const input = c.input as any;

      const newArgs = args as HandlerArgs<
        TContext,
        { input: I['out']; h: NextHelper<R> }
      >;

      newArgs.input = input;
      newArgs.h = NextRouteFactory._createHelper<R, NextResponse<any>>(
        {
          json: (data, status) => {
            return NextResponse.json(data, { status });
          },
          text: (data, status) => {
            return new NextResponse(data, {
              status,
              headers: { 'Content-Type': 'text/plain' },
            });
          },
        },
        this._validateResponse ? route : undefined,
      );

      const response = await handler(newArgs);

      return response;
    };

    this._router.add(route.method, route.getRoutingPath(), finalHandler);

    return this;
  }

  get<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('get', path, handler);
    return this;
  }

  post<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('post', path, handler);
    return this;
  }

  put<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('put', path, handler);
    return this;
  }

  delete<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('delete', path, handler);
    return this;
  }

  patch<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('patch', path, handler);
    return this;
  }

  options<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('options', path, handler);
    return this;
  }

  afterResponse(
    middleware: (
      args: HandlerArgs<TContext>,
      response: NextResponse,
    ) => MaybePromise<void>,
  ) {
    this._hooks.afterResponse.push(middleware);
    return this;
  }

  onError(
    middleware: (
      args: HandlerArgs<TContext>,
      error: unknown,
    ) => MaybePromise<void | NextResponse>,
  ) {
    this._hooks.error.push(middleware);
    return this;
  }

  get handlers(): Record<NextMethod, NextHandler | undefined> {
    const handler: NextHandler = async (req) => {
      const { response, args, success, error } =
        await this._router.dispatch(req);

      try {
        if (success) {
          for (const hook of this._hooks.afterResponse) {
            await hook(args as HandlerArgs<TContext>, response);
          }
        } else {
          throw error;
        }
        return response;
      } catch (error) {
        for (const hook of this._hooks.error) {
          const res = await hook(args as HandlerArgs<TContext>, error);
          if (res) {
            return res;
          }
        }
        throw error;
      }
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
