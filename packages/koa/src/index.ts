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
  RouteConfig,
  RouteFactory,
} from '@node-openapi/core';
import Koa from 'koa';
import Router, { IMiddleware } from 'koa-router';
import { KoaRequestAdapter } from './request';

export class KoaRouteFactory extends RouteFactory<KoaRequestAdapter> {
  private readonly _middlewares: Array<IMiddleware> = [];

  constructor(private readonly _router: Router = new Router()) {
    super();
  }

  registerApp(app: Koa) {
    app.use(this._router.routes()).use(this._router.allowedMethods());
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
      IMiddleware<'json' extends keyof I['out'] ? { input: I['out'] } : any>
    >
  ) {
    if (route.method === 'trace') {
      throw new Error('trace method is not supported');
    }
    const _router = this._route(route);
    this._router[route.method](
      route.path,
      this.applyMiddlewares.bind(this),
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
    this._router.use(path, this.applyMiddlewares.bind(this) as any);
    this._router.use(path, routeFactory._router.routes());

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, routeFactory);
  }

  async applyMiddlewares(ctx: Koa.ParameterizedContext, next: Koa.Next) {
    // Create a middleware execution chain
    const dispatch = async (index: number): Promise<void> => {
      if (index >= this._middlewares.length) {
        return next();
      }

      const middleware = this._middlewares[index];
      return middleware(ctx as any, () => dispatch(index + 1));
    };

    // Start executing middleware chain from the beginning
    return dispatch(0);
  }
}
