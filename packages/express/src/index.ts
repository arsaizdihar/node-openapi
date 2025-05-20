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
  MaybePromise,
  OpenAPIDefinitions,
  Prettify,
  RouteConfig,
  RouteConfigToHandlerResponse,
  RouteFactory,
} from '@node-openapi/core';
import {
  NextFunction,
  Request,
  RequestHandler as ExpressRequestHandler,
  Response,
  Router,
} from 'express';
import { ExpressRequestAdapter } from './request';
export { z } from '@node-openapi/core';

export type { OpenAPIDefinitions, RouteConfig };

type RequestArg<
  ReqContext extends Record<string, any>,
  Input = never,
  H extends Helper<any> = Helper<any>,
  Locals extends Record<string, any> = Record<string, any>,
  P = Record<string, string>,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends Record<string, any> = Record<string, any>,
> = Prettify<{
  context: ReqContext;
  req: Request<P, ResBody, ReqBody, ReqQuery, Locals>;
  res: Response<ResBody, Locals>;
  input: Input extends never ? never : Input;
  h: H;
}>;

type RequestHandler<
  ReqContext extends Record<string, any>,
  Input = never,
  H extends Helper<any> = Helper<any>,
  Locals extends Record<string, any> = Record<string, any>,
  P = Record<string, string>,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends Record<string, any> = Record<string, any>,
> = (
  req: RequestArg<ReqContext, Input, H, Locals, P, ResBody, ReqBody, ReqQuery>,
  next: NextFunction,
) => MaybePromise<void>;

const INTERNAL = Symbol('INTERNAL');

export class ExpressRouteFactory<
  TContext extends Record<string, any> = Record<string, any>,
  Locals extends Record<string, any> = Record<string, any>,
> extends RouteFactory<ExpressRequestAdapter> {
  private readonly _middlewares: Array<ExpressRequestHandler> = [];

  constructor(private readonly _router: Router = Router()) {
    super();
  }

  extend<NewLocals extends Locals>(): ExpressRouteFactory<NewLocals> {
    const factory = new ExpressRouteFactory<NewLocals>();
    factory._middlewares.push(...this._middlewares);
    return factory;
  }

  middleware<M extends RequestHandler<TContext, never, Helper<any>, Locals>>(
    middleware: M,
  ) {
    this._middlewares.push(
      ExpressRouteFactory.toExpressRequestHandler<any>(middleware as any),
    );
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
        TContext,
        I['out'],
        Helper<R>,
        Locals,
        Record<string, string>,
        'data' extends keyof RouteConfigToHandlerResponse<R>
          ? RouteConfigToHandlerResponse<R>['data']
          : any,
        'json' extends keyof I['out'] ? I['out']['json'] : any,
        'query' extends keyof I['out']
          ? I['out']['query'] extends Record<string, any>
            ? I['out']['query']
            : Record<string, any>
          : Record<string, any>
      >
    >
  ) {
    const _route = this._route(route);
    const expressHandlers = handlers.map((handler) =>
      ExpressRouteFactory.toExpressRequestHandler<R>(
        handler as RequestHandler<Record<string, any>, any>,
      ),
    );

    const validatorMiddleware = ExpressRouteFactory.toExpressRequestHandler<R>(
      async (c, next) => {
        const validatorContext: Context<ExpressRequestAdapter> = {
          req: new ExpressRequestAdapter(c.req),
          input: {},
        };

        try {
          const { input } = await _route(validatorContext);
          // @ts-expect-error it is our internal property
          c.req[INTERNAL].input = input as I['out'];
          next();
        } catch (error) {
          next(error);
          return;
        }
      },
    );

    this._router[route.method](
      route.getRoutingPath(),
      ...this._middlewares,
      validatorMiddleware,
      ...expressHandlers,
    );
  }

  private static createHelper<R extends RouteConfig>(res: Response): Helper<R> {
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

  private static toExpressRequestHandler<R extends RouteConfig>(
    handler: RequestHandler<Record<string, any>, any>,
  ): ExpressRequestHandler {
    return (req, res, next) => {
      // @ts-expect-error it is our internal property
      let c = req[INTERNAL] as
        | {
            context: Record<string, any>;
            input: unknown;
            h: Helper<R>;
          }
        | undefined;
      if (!c) {
        c = {
          context: {} as Record<string, any>,
          h: ExpressRouteFactory.createHelper(res),
        } as {
          context: Record<string, any>;
          input: unknown;
          h: Helper<R>;
        };
        // @ts-expect-error it is our internal property
        req[INTERNAL] = c;
      }
      return handler(
        {
          context: c.context,
          input: c.input,
          h: c.h,
          req,
          res,
        },
        next,
      );
    };
  }
}

export const { createRoute } = ExpressRouteFactory;
