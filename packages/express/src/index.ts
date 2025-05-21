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
  CoreOpenAPIRouter,
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
  H = Helper<any>,
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
  H = Helper<any>,
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

export type OpenAPIRouterOptions = {
  expressRouter?: Router;
  validateResponse?: boolean;
};

export class OpenAPIRouter<
  TContext extends Record<string, unknown> = Record<string, unknown>,
  Locals extends Record<string, any> = Record<string, any>,
> extends CoreOpenAPIRouter<ExpressRequestAdapter> {
  private readonly _middlewares: Array<ExpressRequestHandler> = [];
  private readonly _expressRouter: Router;
  private readonly _validateResponse: boolean;

  /**
   * Create a new router instance for express
   * @param options - Construct options
   * @param options.expressRouter - The express router to use. Defaults to a new instance of express.Router(). Use express() for the main router.
   * @param options.validateResponse - Whether to validate the response. Defaults to true
   *
   * @example
   * ```ts
   * const mainRouter = new OpenAPIRouter({ expressRouter: express() });
   *
   * const authedRouter = new OpenAPIRouter<{ user: { id: string } }>({ validateResponse: false });
   *
   * ```
   */
  constructor(options: OpenAPIRouterOptions = {}) {
    super();
    this._expressRouter = options.expressRouter ?? Router();
    this._validateResponse = options.validateResponse ?? true;
  }

  /**
   * Extend the router with a new context. It will create a new instance with the current middlewares as the initial new middlewares.
   * @param options - Construct options
   * @param options.expressRouter - The express router to use. Defaults to a new instance of express.Router(). Use express() for the main router.
   * @param options.validateResponse - Whether to validate the response. Defaults to true
   *
   * @example
   * ```ts
   * const authedRouter = publicRouter.extend<{ user: { id: string } }>();
   * ```
   */
  extend<NewContext extends TContext>({
    expressRouter,
    validateResponse,
  }: OpenAPIRouterOptions = {}): OpenAPIRouter<NewContext> {
    const router = new OpenAPIRouter<NewContext>({
      validateResponse: validateResponse ?? this._validateResponse,
      expressRouter,
    });
    router._middlewares.push(...this._middlewares);
    return router;
  }

  /**
   * Add a middleware to the router. It will be applied to the router's handlers and it's children. The execution will not continue if the next function is not called.
   * @param middleware
   *
   * @example
   * ```ts
   * router.middleware(async ({ req, res }, next) => {
   *   // ...
   *
   *   next();
   * });
   * ```
   */
  middleware<M extends RequestHandler<TContext, never, Helper<any>, Locals>>(
    middleware: M,
  ) {
    this._middlewares.push(
      OpenAPIRouter.toExpressRequestHandler<any>(middleware as any),
    );
  }

  /**
   * Add the handler into a route
   * @param route - The route config to add
   * @param handlers - The handlers to add. These will have the validated input as the argument.
   *
   * @example
   * ```ts
   * router.route('/users', async ({ req, res, h, input, context }, next) => {
   *   // ...
   *
   *   h.json(res, { message: 'Hello, world!' });
   * });
   * ```
   */
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
        'query' extends keyof I['in']
          ? I['in']['query'] extends Record<string, any>
            ? I['in']['query']
            : Record<string, any>
          : Record<string, any>
      >
    >
  ) {
    const _route = this._route(route);
    const expressHandlers = handlers.map((handler) =>
      OpenAPIRouter.toExpressRequestHandler<R>(
        handler as any,
        this._validateResponse ? route : undefined,
      ),
    );

    const validatorMiddleware = OpenAPIRouter.toExpressRequestHandler<R>(
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
      this._validateResponse ? route : undefined,
    );

    this._expressRouter[route.method](
      route.getRoutingPath(),
      ...this._middlewares,
      validatorMiddleware,
      ...expressHandlers,
    );
  }

  private static createHelper<R extends RouteConfig>(
    res: Response,
    routeConfig?: R,
  ) {
    return OpenAPIRouter._createHelper(
      {
        json: (data, status) => {
          return res.status(status ?? 200).json(data);
        },
        text: (data, status) => {
          return res
            .header('Content-Type', 'text/plain')
            .status(status ?? 200)
            .send(data);
        },
      },
      routeConfig,
    );
  }

  /**
   * Add a child subrouter to the router under a base path.
   * @param path - The base path to use
   * @param router - The subrouter to use
   *
   * @example
   * ```ts
   * router.use('/users', userRouter);
   * ```
   */
  use(path: string, router: OpenAPIRouter) {
    if (this._middlewares.length > 0) {
      this._expressRouter.use(path, ...this._middlewares);
    }
    this._expressRouter.use(path, router._expressRouter);

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, router);
  }

  /**
   * Add a documentation route to the router.
   * @param path - The path where the documentation will be available
   * @param configure - The OpenAPI configuration
   * @param additionalDefinitions - The additional OpenAPI definitions to add
   *
   * @example
   * ```ts
   * router.doc('/docs', { openapi: '3.1.0' });
   * ```
   */
  doc<P extends string>(
    path: P,
    configure: OpenAPIObjectConfigV31,
    additionalDefinitions?: OpenAPIDefinitions[],
  ) {
    this._expressRouter.get(path, (_, res, next) => {
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
    routeConfig?: R,
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
          h: OpenAPIRouter.createHelper(res, routeConfig),
          input: undefined,
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
          h: c.h as any,
          req,
          res,
        },
        next,
      );
    };
  }
}

export const { createRoute } = OpenAPIRouter;
