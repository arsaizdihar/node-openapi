import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Context,
  Helper,
  Input,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  PrettifyRec,
  RouteConfig,
  RouteConfigToHandlerResponse,
  RouteFactory,
} from '@node-openapi/core';
import Koa from 'koa';
import Router from 'koa-router';
import { KoaRequestAdapter } from './request';
export { z, OpenAPIDefinitions, RouteConfig } from '@node-openapi/core';

export class KoaRouteFactory<
  StateT = unknown,
> extends RouteFactory<KoaRequestAdapter> {
  private readonly _middlewares: Array<Koa.Middleware<StateT>> = [];
  private readonly _router: Router = new Router();
  private _validateResponse: boolean;

  constructor(options: { router?: Router; validateResponse?: boolean } = {}) {
    super();
    this._validateResponse = options.validateResponse ?? true;
    this._router = options.router ?? new Router();
  }

  extend<NewStateT>(): KoaRouteFactory<NewStateT> {
    const factory = new KoaRouteFactory<NewStateT>();
    factory._middlewares.push(
      ...(this._middlewares as unknown as Koa.Middleware<NewStateT>[]),
    );
    return factory;
  }

  registerApp(app: Koa) {
    app.use(this._router.routes());
    app.use(this._router.allowedMethods());
  }

  middleware<R extends Koa.Middleware<StateT>>(handler: R) {
    this._middlewares.push(handler);
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
    ...handlers: Array<
      Koa.Middleware<
        PrettifyRec<StateT>,
        Koa.DefaultContext & { input: I['out']; h: Helper<R> },
        'data' extends keyof RouteConfigToHandlerResponse<R>
          ? RouteConfigToHandlerResponse<R>['data']
          : any
      >
    >
  ) {
    if (route.method === 'trace') {
      throw new Error('trace method is not supported');
    }
    const _router = this._route(route);
    this._router[route.method](
      route.getRoutingPath(),
      ...this._middlewares,
      async (ctx, next) => {
        const context: Context<KoaRequestAdapter, I> = {
          req: new KoaRequestAdapter(
            ctx.request,
            new Proxy(
              {},
              {
                get: (_, prop) => {
                  if (typeof prop === 'string') {
                    return ctx.cookies.get(prop);
                  }
                  return undefined;
                },
              },
            ),
            ctx.params,
          ),
          input: {},
        };
        const c = await _router(context);
        (ctx as any).input = c.input;
        (ctx as any).h = KoaRouteFactory._createHelper(
          {
            json: (data, status) => {
              ctx.status = status;
              ctx.body = data;
            },
            text: (data, status) => {
              ctx.status = status;
              ctx.body = data;
            },
          },
          this._validateResponse ? route : undefined,
        );
        await next();
      },
      ...(handlers as Koa.Middleware[]),
    );
  }

  doc<P extends string>(path: P, configure: OpenAPIObjectConfigV31) {
    this._router.get(path, (ctx) => {
      try {
        const document = this.getOpenAPIDocument(configure);
        ctx.body = document;
      } catch (error) {
        ctx.status = 500;
        ctx.body = { error: error };
      }
    });
  }

  router(path: string, routeFactory: KoaRouteFactory) {
    if (this._middlewares.length > 0) {
      this._router.use(path, ...this._middlewares);
    }
    this._router.use(
      path,
      routeFactory._router.routes(),
      routeFactory._router.allowedMethods(),
    );

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, routeFactory);
  }
}

export const { createRoute } = KoaRouteFactory;
