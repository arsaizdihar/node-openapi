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
  Prettify,
  RouteConfig,
  RouteFactory,
} from '@node-openapi/core';
import Koa from 'koa';
import Router, { IMiddleware } from 'koa-router';
import { KoaRequestAdapter } from './request';

export class KoaRouteFactory<
  StateT = unknown,
> extends RouteFactory<KoaRequestAdapter> {
  private readonly _middlewares: Array<IMiddleware<StateT>> = [];

  constructor(private readonly _router: Router = new Router()) {
    super();
  }

  registerApp(app: Koa) {
    app.use(this._router.routes()).use(this._router.allowedMethods());
  }

  middleware<R extends IMiddleware<StateT>>(handler: R) {
    this._middlewares.push(handler);
  }

  route<
    R extends RouteConfig,
    I extends Input = InputTypeParam<R> &
      InputTypeQuery<R> &
      InputTypeHeader<R> &
      InputTypeCookie<R> &
      InputTypeForm<R> &
      InputTypeJson<R>,
  >(
    route: R,
    ...handlers: Array<
      IMiddleware<
        'json' extends keyof I['out']
          ? Prettify<{ input: I['out'] } & StateT>
          : StateT
      >
    >
  ) {
    if (route.method === 'trace') {
      throw new Error('trace method is not supported');
    }
    const _router = this._route(route);
    this._router[route.method](
      route.path,
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
        ctx.state.input = c.input;
        next();
      },
      ...handlers,
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
    this._router.use(path, ...this._middlewares);
    this._router.use(path, routeFactory._router.routes());

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, routeFactory);
  }
}

export const { createRoute } = KoaRouteFactory;
