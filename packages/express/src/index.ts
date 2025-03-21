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
  RouteConfigToHandlerResponse,
  RouteFactory,
} from '@node-openapi/core';
import { NextFunction, RequestHandler, Router } from 'express';
import { ExpressRequestAdapter } from './request';

export class ExpressRouteFactory extends RouteFactory<ExpressRequestAdapter> {
  private readonly _middlewares: Array<RequestHandler> = [];

  constructor(private readonly _router: Router = Router()) {
    super();
  }

  middleware<R extends RequestHandler>(handler: R) {
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
        RouteConfigToHandlerResponse<R>['data'],
        'json' extends keyof I['out'] ? I['out']['json'] : any,
        'query' extends keyof I['out'] ? I['out']['query'] : any,
        I['out'] extends {} ? I['out'] : any
      >
    >
  ) {
    const _route = this._route(route);
    this._router[route.method](
      route.path,
      this.applyMiddlewares.bind(this) as any,
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
    this._router.use(path, this.applyMiddlewares.bind(this) as any);
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
        console.log(error);
        res.status(500).json({
          error: error,
        });
      }
    });
  }

  async applyMiddlewares(req: Request, res: Response, next: NextFunction) {
    let nextCalled = false;
    let error: Error | string | undefined;

    const _next = (err?: Error | string) => {
      nextCalled = true;
      if (err) {
        error = err;
      }
    };

    for (const middleware of this._middlewares) {
      nextCalled = false;
      await middleware(req as any, res as any, _next);

      // If next wasn't called, assume middleware handled the response
      if (!nextCalled) {
        return;
      }

      // If there was an error, pass it to the next error handler
      if (error) {
        next(error);
        return;
      }
    }

    // Continue to the next middleware in the route
    next();
  }
}

export const { createRoute } = ExpressRouteFactory;
