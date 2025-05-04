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
  OpenAPIDefinitions,
  Prettify,
  RouteConfig,
  RouteConfigToHandlerResponse,
  RouteFactory,
} from '@node-openapi/core';
import { RequestHandler, Response, Router } from 'express';
import { ExpressRequestAdapter } from './request';
export { z } from '@node-openapi/core';

export type { OpenAPIDefinitions, RouteConfig };

export class ExpressRouteFactory<
  Locals extends Record<string, any> = Record<string, any>,
> extends RouteFactory<ExpressRequestAdapter> {
  private readonly _middlewares: Array<
    RequestHandler<Record<string, string>, any, any, any, Locals>
  > = [];

  constructor(private readonly _router: Router = Router()) {
    super();
  }

  extend<NewLocals extends Locals>(): ExpressRouteFactory<NewLocals> {
    const factory = new ExpressRouteFactory<NewLocals>();
    factory._middlewares.push(...this._middlewares);
    return factory;
  }

  middleware<
    R extends RequestHandler<Record<string, string>, any, any, any, Locals>,
  >(handler: R) {
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
      RequestHandler<
        Record<string, string>,
        'data' extends keyof RouteConfigToHandlerResponse<R>
          ? RouteConfigToHandlerResponse<R>['data']
          : any,
        'json' extends keyof I['out'] ? I['out']['json'] : any,
        'query' extends keyof I['out'] ? I['out']['query'] : any,
        I['out'] extends {}
          ? Prettify<I['out'] & Locals & { helper: Helper<R> }>
          : Locals & { helper: Helper<R> }
      >
    >
  ) {
    const _route = this._route(route);

    this._router[route.method](
      route.getRoutingPath(),
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
            helper: this.createHelper(res),
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

  createHelper<R extends RouteConfig>(res: Response): Helper<R> {
    const helper = {
      json: (response: { data: any; status: number }) => {
        res.status(response.status).json(response.data);
      },
      text: (response: { data: string; status: number }) => {
        res.status(response.status).send(response.data);
      },
    };
    return helper as Helper<R>;
  }

  router(path: string, routeFactory: ExpressRouteFactory) {
    if (this._middlewares.length > 0) {
      this._router.use(path, ...this._middlewares);
    }
    this._router.use(path, routeFactory._router);

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, routeFactory);
  }

  doc<P extends string>(
    path: P,
    configure: OpenAPIObjectConfigV31,
    additionalDefinitions?: OpenAPIDefinitions[],
  ) {
    this._router.get(path, (_, res, next) => {
      try {
        const document = this.getOpenAPIDocument(
          configure,
          additionalDefinitions,
        );
        res.json(document);
      } catch (error) {
        next(error);
      }
    });
  }
}

export function helper<Locals extends Record<string, any>>(
  res: Response<any, Locals>,
): Locals['helper'] {
  return res.locals.helper;
}

export const { createRoute } = ExpressRouteFactory;
