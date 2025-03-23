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
  RouteConfigToHandlerResponse,
  RouteFactory,
} from '@node-openapi/core';
import { RequestHandler, Router } from 'express';
import { ExpressRequestAdapter } from './request';

export class ExpressRouteFactory<
  Locals extends Record<string, any> = Record<string, any>,
> extends RouteFactory<ExpressRequestAdapter> {
  private readonly _middlewares: Array<
    RequestHandler<Record<string, string>, any, any, any, Locals>
  > = [];

  constructor(private readonly _router: Router = Router()) {
    super();
  }

  middleware<
    R extends RequestHandler<Record<string, string>, any, any, any, Locals>,
  >(handler: R) {
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
      RequestHandler<
        Record<string, string>,
        'data' extends keyof RouteConfigToHandlerResponse<R>
          ? RouteConfigToHandlerResponse<R>['data']
          : any,
        'json' extends keyof I['out'] ? I['out']['json'] : any,
        'query' extends keyof I['out'] ? I['out']['query'] : any,
        I['out'] extends {} ? Prettify<I['out'] & Locals> : Locals
      >
    >
  ) {
    const _route = this._route(route);
    this._router[route.method](
      route.path,
      ...this._middlewares,
      async (req, res, next) => {
        const context: Context<ExpressRequestAdapter> = {
          req: new ExpressRequestAdapter(req as any),
          input: {},
        };
        try {
          const c = await _route(context);
          const input = c.input as any;
          res.locals = {
            ...res.locals,
            ...input,
          };
          next();
        } catch (error) {
          next(error);
          return;
        }
      },
      ...handlers,
    );
  }

  router(path: string, routeFactory: ExpressRouteFactory) {
    this._router.use(path, ...this._middlewares);
    this._router.use(path, routeFactory._router);

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, routeFactory);
  }

  doc<P extends string>(path: P, configure: OpenAPIObjectConfigV31) {
    this._router.get(path, (_, res) => {
      try {
        const document = this.getOpenAPIDocument(configure);
        res.json(document);
      } catch (error) {
        res.status(500).json({
          error: error,
        });
      }
    });
  }
}

export const { createRoute } = ExpressRouteFactory;
