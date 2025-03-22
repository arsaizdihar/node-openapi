import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Context,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  RouteConfig,
  RouteFactory,
} from '@node-openapi/core';
import { Env, Handler, Hono, Input, ValidationTargets } from 'hono';
import { BlankEnv, MiddlewareHandler } from 'hono/types';
import { HonoRequestAdapter } from './request';

export class HonoRouteFactory<
  E extends Env = BlankEnv,
> extends RouteFactory<HonoRequestAdapter> {
  private readonly _middlewares: Array<MiddlewareHandler<E>> = [];

  constructor(private readonly _app = new Hono<E>()) {
    super();
  }

  middleware<R extends MiddlewareHandler<E>>(handler: R) {
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
  >(route: R, ...handlers: Handler<any, any, I>[]) {
    const _route = this._route(route);
    this._app.on(
      [route.method],
      route.path,
      ...this._middlewares,
      async (c, next) => {
        const context: Context<HonoRequestAdapter> = {
          req: new HonoRequestAdapter(c.req),
          input: {},
        };
        const cResult = await _route(context);
        const input = cResult.input as any;

        for (const key in input) {
          c.req.addValidatedData(key as keyof ValidationTargets, input[key]);
        }

        await next();
      },
      ...handlers,
    );
  }

  doc<P extends string>(path: P, configure: OpenAPIObjectConfigV31): void {
    this._app.get(path, (c) => {
      try {
        const document = this.getOpenAPIDocument(configure);
        return c.json(document);
      } catch (error) {
        return c.json(
          {
            error: error,
          },
          500,
        );
      }
    });
  }

  router<E extends Env>(path: string, routeFactory: HonoRouteFactory<E>) {
    this._app.use(path, ...this._middlewares);
    this._app.route(path, routeFactory._app);

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, routeFactory);
  }
}

export const { createRoute } = HonoRouteFactory;
