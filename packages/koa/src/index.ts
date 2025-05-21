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
  CoreOpenAPIRouter,
} from '@node-openapi/core';
import Koa from 'koa';
import Router from 'koa-router';
import { KoaRequestAdapter } from './request';
export { z, OpenAPIDefinitions, RouteConfig } from '@node-openapi/core';

export type OpenAPIRouterOptions = {
  router?: Router;
  validateResponse?: boolean;
};

/**
 * Router for Koa with OpenAPI support.
 * Integrates with `@node-openapi/core` for request validation and OpenAPI document generation,
 * and uses `koa-router` for routing.
 *
 * @template StateT - The Koa custom state type.
 *
 * @example
 * ```ts
 * import Koa from 'koa';
 * import { OpenAPIRouter, createRoute, z } from '@node-openapi/koa';
 *
 * const app = new Koa();
 * const router = new OpenAPIRouter<{ user?: { id: string } }>(); // Koa StateT
 *
 * const healthRoute = createRoute({
 *   method: 'get',
 *   path: '/health',
 *   getRoutingPath: () => '/health', // Koa-router path
 *   responses: {
 *     200: {
 *       description: 'Service is healthy',
 *       content: {
 *         'application/json': {
 *           schema: z.object({ status: z.literal('ok') }),
 *         },
 *       },
 *     },
 *   },
 * });
 *
 * router.route(healthRoute, (ctx) => {
 *   ctx.h.json({ status: 'ok' }, 200);
 * });
 *
 * router.doc('/openapi.json', {
 *   openapi: '3.1.0',
 *   info: { title: 'My Koa API', version: '1.0.0' },
 * });
 *
 * router.registerApp(app); // Registers routes with the Koa app
 *
 * app.listen(3000, () => {
 *   console.log('Server running on port 3000');
 * });
 * ```
 */
export class OpenAPIRouter<
  StateT = unknown,
> extends CoreOpenAPIRouter<KoaRequestAdapter> {
  private readonly _middlewares: Array<Koa.Middleware<StateT>> = [];
  private readonly _router: Router = new Router();
  private _validateResponse: boolean;

  /**
   * Creates a new OpenAPIRouter for Koa.
   * @param options - Options for the router.
   * @param options.router - An optional existing `koa-router` instance. If not provided, a new one is created.
   * @param options.validateResponse - Whether to validate responses using `ctx.h.json` or `ctx.h.text`. Defaults to `true`.
   */
  constructor(options: OpenAPIRouterOptions = {}) {
    super();
    this._validateResponse = options.validateResponse ?? true;
    this._router = options.router ?? new Router();
  }

  /**
   * Extends the router, creating a new instance with a potentially different Koa State type (`NewStateT`).
   * Middlewares from the parent router are carried over to the new instance.
   * This is useful for creating a chain of routers or middlewares with evolving state types.
   *
   * @returns A new `OpenAPIRouter` instance with the specified `NewStateT` type.
   *
   * @example
   * ```ts
   * type StateWithUser = { user: { id: string } };
   * const baseRouter = new OpenAPIRouter();
   * const authedRouter = baseRouter.extend<StateWithUser>();
   * // authedRouter can now use middlewares and handlers expecting `ctx.state.user`
   * ```
   */
  extend<NewStateT>(): OpenAPIRouter<NewStateT> {
    const router = new OpenAPIRouter<NewStateT>();
    router._middlewares.push(
      ...(this._middlewares as unknown as Koa.Middleware<NewStateT>[]),
    );
    return router;
  }

  /**
   * Registers the `koa-router` instance associated with this `OpenAPIRouter`
   * with the provided Koa application.
   * This makes all defined routes and sub-routers active.
   *
   * @param app - The Koa application instance.
   *
   * @example
   * ```ts
   * const app = new Koa();
   * const router = new OpenAPIRouter();
   * // ... define routes and middlewares on router ...
   * router.registerApp(app);
   * ```
   */
  registerApp(app: Koa) {
    app.use(this._router.routes());
    app.use(this._router.allowedMethods());
  }

  /**
   * Adds a Koa middleware to this router instance.
   * These middlewares will be applied to all routes subsequently defined on this router instance
   * using `.route()` and also to routes in sub-routers mounted via `.use()` before their own middlewares.
   *
   * @param handler - A Koa `Middleware` function compatible with the router's `StateT`.
   *                It can modify `ctx.state` (typed as `StateT`).
   *
   * @example
   * ```ts
   * router.middleware(async (ctx, next) => {
   *   // Example: Attaching a user to Koa's context state
   *   // ctx.state.user = await authenticateUser(ctx.get('Authorization'));
   *   console.log('Middleware running!');
   *   await next();
   * });
   * ```
   */
  middleware<R extends Koa.Middleware<StateT>>(handler: R) {
    this._middlewares.push(handler);
  }

  /**
   * Defines a route on the `koa-router` instance associated with this `OpenAPIRouter`.
   * It applies previously registered middlewares, then performs input validation based on `routeConfig`,
   * and finally executes the provided Koa middleware handlers.
   * The Koa context `ctx` is augmented with:
   *  - `ctx.input`: The validated request input data.
   *  - `ctx.h`: A helper object with `json` and `text` methods for type-safe, schema-validated responses.
   *
   * @param route - The route configuration object, created using `createRoute`.
   *                It must include `getRoutingPath()` returning the `koa-router` compatible path string.
   * @param handlers - One or more Koa `Middleware` functions. These handlers will receive the augmented Koa context `ctx`.
   *
   * @example
   * ```ts
   * const getUserRoute = createRoute({
   *   method: 'get',
   *   path: '/users/{id}', // OpenAPI path
   *   getRoutingPath: () => '/users/:id', // koa-router path
   *   request: {
   *     params: z.object({ id: z.string().openapi({ example: '123' }) }),
   *   },
   *   responses: {
   *     200: {
   *       description: 'User found',
   *       content: {
   *         'application/json': { schema: z.object({ id: z.string(), name: z.string() }) },
   *       },
   *     },
   *     404: { description: 'User not found' },
   *   },
   * });
   *
   * router.route(getUserRoute, (ctx) => {
   *   const { id } = ctx.input.params;
   *   // const user = await findUser(id, ctx.state.db); // ctx.state is StateT
   *   // if (!user) return ctx.h.text('Not Found', 404);
   *   ctx.h.json({ id, name: 'John Doe' }, 200);
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
        (ctx as any).h = OpenAPIRouter._createHelper(
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

  /**
   * Registers a GET route on the `koa-router` to serve the OpenAPI documentation.
   *
   * @param path - The path where the OpenAPI document will be served (e.g., '/openapi.json').
   * @param configure - The base OpenAPI configuration object (from `@asteasolutions/zod-to-openapi`).
   *
   * @example
   * ```ts
   * router.doc('/api/v1/openapi.json', {
   *   openapi: '3.1.0',
   *   info: {
   *     title: 'My Koa Service API',
   *     version: '1.0.0',
   *   },
   * });
   * ```
   */
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

  /**
   * Mounts another `OpenAPIRouter`'s `koa-router` instance as a sub-router under a specified path.
   * This allows for modular composition of Koa applications using `koa-router`'s nesting capabilities.
   * Middlewares from this parent router will be applied before the sub-router's middlewares and routes.
   * OpenAPI definitions from the sub-router are merged into the parent router's definitions.
   *
   * @param path - The base path under which the sub-router will be mounted (e.g., '/admin').
   * @param router - The `OpenAPIRouter` instance whose internal `koa-router` will be mounted.
   *
   * @example
   * ```ts
   * const adminRouter = new OpenAPIRouter();
   * // Define routes and middlewares on adminRouter ...
   *
   * mainRouter.use('/admin', adminRouter);
   * // Now adminRouter handles requests to /admin/*
   * ```
   */
  use(path: string, router: OpenAPIRouter) {
    if (this._middlewares.length > 0) {
      this._router.use(path, ...this._middlewares);
    }
    this._router.use(
      path,
      router._router.routes(),
      router._router.allowedMethods(),
    );

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, router);
  }
}

export const { createRoute } = OpenAPIRouter;
