import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Context,
  HelperResponseArg,
  Input,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  MaybePromise,
  OpenAPIDefinitions,
  RouteConfig,
  RouteConfigToHandlerResponse,
  CoreOpenAPIRouter,
  z,
} from '@node-openapi/core';
import { NextRequest, NextResponse } from 'next/server';
import { NextRequestAdapter } from './request';
import { HandlerArgs, RouteHandler, Router, RouterMiddleware } from './router';
export { z };
export type { OpenAPIDefinitions, RouteConfig };

export type NextHelper<R extends RouteConfig> = {
  json: <Response extends HelperResponseArg<R, 'json'>>(
    response: Response,
  ) => NextResponse<Response['data']>;
  text: <Response extends HelperResponseArg<R, 'text', string>>(
    response: Response,
  ) => NextResponse<Response['data']>;
};

type NextHandler = (req: NextRequest) => MaybePromise<NextResponse>;

type NextMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD';

export type OpenAPIRouterOptions = {
  validateResponse?: boolean;
};

/**
 * Router for Next.js App Router with OpenAPI support.
 * Integrates with `@node-openapi/core` for request validation and OpenAPI document generation.
 * It provides a way to structure Next.js route handlers (`GET`, `POST`, etc.) while leveraging
 * OpenAPI for validation and documentation.
 *
 * @template TContext - A custom context type that can be passed through middlewares to handlers.
 *
 * @example
 * // app/api/[[...slug]]/route.ts
 * import { OpenAPIRouter, createRoute, z } from '@node-openapi/next';
 *
 * type MyAppContext = { userId?: string };
 *
 * const router = new OpenAPIRouter<MyAppContext>();
 *
 * const healthRoute = createRoute({
 *   method: 'get',
 *   path: '/health',
 *   getRoutingPath: () => '/health', // Next.js App Router path segment
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
 * router.route(healthRoute, async ({ h, context }) => {
 *   // context.userId is available if set by a middleware
 *   return h.json({ status: 'ok' });
 * });
 *
 * router.doc('/openapi.json', {
 *   openapi: '3.1.0',
 *   info: { title: 'My Next.js API', version: '1.0.0' },
 * });
 *
 * // Export handlers for Next.js App Router
 * export const { GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD } = router.handlers;
 */
export class OpenAPIRouter<
  TContext extends Record<string, unknown> = Record<string, unknown>,
> extends CoreOpenAPIRouter<NextRequestAdapter> {
  private _router = new Router();
  private _hooks = {
    afterResponse:
      Array<
        (
          args: HandlerArgs<TContext>,
          response: NextResponse,
        ) => MaybePromise<void>
      >(),
    error: [] as Array<
      (
        args: HandlerArgs<TContext>,
        error: unknown,
      ) => MaybePromise<void | NextResponse>
    >,
  };
  private _validateResponse: boolean;

  /**
   * Creates a new OpenAPIRouter for Next.js App Router.
   * @param options - Options for the router.
   * @param options.validateResponse - Whether to validate responses using `args.h.json` or `args.h.text`. Defaults to `true`.
   */
  constructor(options: OpenAPIRouterOptions = {}) {
    super();
    this._validateResponse = options.validateResponse ?? true;
  }

  /**
   * Extends the router, creating a new instance with a potentially different `TContext` type.
   * Middlewares and other configurations are copied from the parent router.
   * This is useful for creating a chain of routers or middlewares with evolving context types.
   *
   * @param options - Options for the new router instance.
   * @param options.validateResponse - Whether to validate responses. Defaults to the parent router's setting.
   * @returns A new `OpenAPIRouter` instance with the combined context type.
   *
   * @example
   * ```ts
   * type BaseContext = { requestId: string };
   * type UserContext = BaseContext & { user: { id: string } };
   *
   * const baseRouter = new OpenAPIRouter<BaseContext>();
   * // Add middleware to baseRouter to set requestId on context
   *
   * const userRouter = baseRouter.extend<UserContext>();
   * // userRouter now has context type UserContext
   * // Add middleware to userRouter to set user on context
   * ```
   */
  extend<NewContext extends Record<string, unknown>>(
    options: OpenAPIRouterOptions = {},
  ): OpenAPIRouter<TContext & NewContext> {
    const router = new OpenAPIRouter<TContext & NewContext>({
      validateResponse: options.validateResponse ?? this._validateResponse,
    });
    router._router = this._router.copy();
    return router;
  }

  /**
   * Registers a GET route to serve the OpenAPI documentation.
   * The path should correspond to a segment in your Next.js App Router file structure.
   * For example, if your route file is `app/api/[[...slug]]/route.ts`,
   * and you call `router.doc('/openapi.json', ...)`,
   * the document will be available at `/api/openapi.json`.
   *
   * @param path - The path segment where the OpenAPI document will be served.
   * @param configure - The base OpenAPI configuration object (from `@asteasolutions/zod-to-openapi`).
   *
   * @example
   * ```ts
   * // In app/api/[[...slug]]/route.ts
   * router.doc('/spec.json', {
   *   openapi: '3.1.0',
   *   info: { title: 'My API', version: '1.0.0' },
   * });
   * // OpenAPI doc will be at /api/spec.json
   * ```
   */
  doc(path: string, configure: OpenAPIObjectConfigV31) {
    this._router.add('get', path, async () => {
      const document = this.getOpenAPIDocument(configure);
      return NextResponse.json(document);
    });
  }

  /**
   * Adds a middleware to the router.
   * Middlewares are executed in the order they are added, before route handlers.
   * They can modify the `context` object (which is `args.context` in the handler) or return a `NextResponse` to halt execution.
   *
   * @param middleware - A function that receives `HandlerArgs<TContext>` and can return a `NextResponse` or `void` (or a Promise of either).
   *                   The `args.context` can be mutated to pass data to subsequent middlewares or the route handler.
   * @returns The `OpenAPIRouter` instance for chaining.
   *
   * @example
   * ```ts
   * router.middleware(async (args) => {
   *   // Example: Authenticate user and add to context
   *   // const user = await getUserByToken(args.req.headers.get('Authorization'));
   *   // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   *   // args.context.user = user; // Assuming TContext is { user?: UserType }
   * });
   * ```
   */
  middleware(
    middleware: (
      args: HandlerArgs<TContext>,
    ) => MaybePromise<NextResponse | void>,
  ) {
    this._router.middleware(middleware as RouterMiddleware);
    return this;
  }

  /**
   * Mounts another `OpenAPIRouter` instance under a specific path prefix.
   * Routes defined in the sub-router will be prefixed with this path.
   * OpenAPI definitions from the sub-router are merged into this router's definitions.
   *
   * @param path - The path prefix for the sub-router (e.g., '/users').
   *               This path segment is used for both routing and OpenAPI definition merging.
   * @param router - The `OpenAPIRouter` instance to mount.
   * @returns The `OpenAPIRouter` instance for chaining.
   *
   * @example
   * ```ts
   * const userRouter = new OpenAPIRouter<UserContext>();
   * // Define user-specific routes on userRouter ...
   *
   * mainApiRouter.use('/users', userRouter);
   * // Routes like userRouter.get('/profile', ...) will be available at /api/users/profile
   * ```
   */
  use(path: string, router: OpenAPIRouter) {
    this._router.use(path, router._router);
    this._registerRouter(path, router);
    return this;
  }

  /**
   * Defines a route with input validation and OpenAPI documentation.
   * This is the primary method for adding routes that are part of your OpenAPI specification.
   * The handler receives validated input and typed response helpers.
   *
   * @param route - The route configuration object, created using `createRoute`.
   *                It must include `getRoutingPath()` returning the Next.js App Router compatible path segment.
   * @param handler - The route handler function. It receives `args` containing `req`, `params`, the typed `context`,
   *                  validated `input`, and response helpers `h` (`h.json`, `h.text`).
   * @returns The `OpenAPIRouter` instance for chaining.
   *
   * @example
   * ```ts
   * const createUserRoute = createRoute({
   *   method: 'post',
   *   path: '/users',
   *   getRoutingPath: () => '/users',
   *   request: {
   *     body: { content: { 'application/json': { schema: z.object({ name: z.string() }) } } },
   *   },
   *   responses: {
   *     201: { content: { 'application/json': { schema: z.object({ id: z.string(), name: z.string() }) } } },
   *   },
   * });
   *
   * router.route(createUserRoute, async ({ input, h, context }) => {
   *   // const newUser = await db.createUser(input.body.name, context.userId);
   *   // return h.json({ id: newUser.id, name: newUser.name }, { status: 201 });
   *   return h.json({ id: '123', name: input.body.name }, { status: 201 });
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
    handler: RouteHandler<
      TContext,
      { input: I['out']; h: NextHelper<R> },
      'data' extends keyof RouteConfigToHandlerResponse<R>
        ? RouteConfigToHandlerResponse<R>['data']
        : any
    >,
  ) {
    const _route = this._route(route);

    const finalHandler = async (args: HandlerArgs<TContext>) => {
      const context: Context<NextRequestAdapter> = {
        req: new NextRequestAdapter(args.req, args.params),
        input: {},
      };
      const c = await _route(context);
      const input = c.input as any;

      const newArgs = args as HandlerArgs<
        TContext,
        { input: I['out']; h: NextHelper<R> }
      >;

      newArgs.input = input;
      newArgs.h = OpenAPIRouter._createHelper<R, NextResponse<any>>(
        {
          json: (data, status) => {
            return NextResponse.json(data, { status });
          },
          text: (data, status) => {
            return new NextResponse(data, {
              status,
              headers: { 'Content-Type': 'text/plain' },
            });
          },
        },
        this._validateResponse ? route : undefined,
      );

      const response = await handler(newArgs);

      return response;
    };

    this._router.add(route.method, route.getRoutingPath(), finalHandler);

    return this;
  }

  /**
   * Adds a simple GET route without OpenAPI-specific validation or documentation.
   * Use this for routes that are not part of your OpenAPI specification.
   * For OpenAPI-documented routes, use `.route()`.
   *
   * @param path - The route path segment.
   * @param handler - A `RouteHandler` function.
   * @returns The `OpenAPIRouter` instance for chaining.
   */
  get<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('get', path, handler);
    return this;
  }

  /**
   * Adds a simple POST route without OpenAPI-specific validation or documentation.
   * Use this for routes that are not part of your OpenAPI specification.
   * For OpenAPI-documented routes, use `.route()`.
   *
   * @param path - The route path segment.
   * @param handler - A `RouteHandler` function.
   * @returns The `OpenAPIRouter` instance for chaining.
   */
  post<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('post', path, handler);
    return this;
  }

  /**
   * Adds a simple PUT route without OpenAPI-specific validation or documentation.
   * Use this for routes that are not part of your OpenAPI specification.
   * For OpenAPI-documented routes, use `.route()`.
   *
   * @param path - The route path segment.
   * @param handler - A `RouteHandler` function.
   * @returns The `OpenAPIRouter` instance for chaining.
   */
  put<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('put', path, handler);
    return this;
  }

  /**
   * Adds a simple DELETE route without OpenAPI-specific validation or documentation.
   * Use this for routes that are not part of your OpenAPI specification.
   * For OpenAPI-documented routes, use `.route()`.
   *
   * @param path - The route path segment.
   * @param handler - A `RouteHandler` function.
   * @returns The `OpenAPIRouter` instance for chaining.
   */
  delete<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('delete', path, handler);
    return this;
  }

  /**
   * Adds a simple PATCH route without OpenAPI-specific validation or documentation.
   * Use this for routes that are not part of your OpenAPI specification.
   * For OpenAPI-documented routes, use `.route()`.
   *
   * @param path - The route path segment.
   * @param handler - A `RouteHandler` function.
   * @returns The `OpenAPIRouter` instance for chaining.
   */
  patch<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('patch', path, handler);
    return this;
  }

  /**
   * Adds a simple OPTIONS route without OpenAPI-specific validation or documentation.
   * Use this for routes that are not part of your OpenAPI specification.
   * For OpenAPI-documented routes, use `.route()`.
   *
   * @param path - The route path segment.
   * @param handler - A `RouteHandler` function.
   * @returns The `OpenAPIRouter` instance for chaining.
   */
  options<T = any>(path: string, handler: RouteHandler<TContext, unknown, T>) {
    this._router.add('options', path, handler);
    return this;
  }

  /**
   * Registers a hook that is called after a successful response has been generated by a route handler,
   * but before it is returned to Next.js.
   * This can be used for logging, metrics, or modifying the response if necessary (though modifying is generally discouraged).
   *
   * @param middleware - A function that receives `HandlerArgs<TContext>` (with the state from middlewares and handler)
   *                   and the generated `NextResponse`. It should not return a value.
   * @returns The `OpenAPIRouter` instance for chaining.
   *
   * @example
   * ```ts
   * router.afterResponse((args, response) => {
   *   console.log(`Request to ${args.req.url} completed with status ${response.status}`);
   * });
   * ```
   */
  afterResponse(
    middleware: (
      args: HandlerArgs<TContext>,
      response: NextResponse,
    ) => MaybePromise<void>,
  ) {
    this._hooks.afterResponse.push(middleware);
    return this;
  }

  /**
   * Registers a hook that is called when an error occurs during the request processing lifecycle
   * (e.g., in a middleware, input validation, or route handler).
   * Hooks are executed in order. If a hook returns a `NextResponse`, it becomes the final response,
   * and subsequent error hooks are not called. If no hook returns a response, the original error is re-thrown.
   *
   * @param middleware - A function that receives `HandlerArgs<TContext>`, the `error` object,
   *                   and can return a `NextResponse` to handle the error or `void` to pass to the next hook.
   * @returns The `OpenAPIRouter` instance for chaining.
   *
   * @example
   * ```ts
   * router.onError((args, error) => {
   *   console.error(`Error processing ${args.req.url}:`, error);
   *   if (error instanceof MyCustomError) {
   *     return NextResponse.json({ message: error.message }, { status: 400 });
   *   }
   *   // If not handled, error will propagate or be caught by another onError hook or Next.js default handling.
   * });
   * ```
   */
  onError(
    middleware: (
      args: HandlerArgs<TContext>,
      error: unknown,
    ) => MaybePromise<void | NextResponse>,
  ) {
    this._hooks.error.push(middleware);
    return this;
  }

  /**
   * Gets the Next.js App Router compatible request handlers (GET, POST, etc.).
   * These handlers should be exported from a `route.ts` file within the Next.js `app` directory.
   * Each handler incorporates the dispatch logic for middlewares, route matching, validation, OpenAPI route execution,
   * and error/afterResponse hooks.
   *
   * @example
   * ```ts
   * // In app/[[...slug]]/route.ts
   * import { router } from './my-router-setup'; // Assuming router is an OpenAPIRouter instance
   * export const { GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD } = router.handlers;
   * ```
   */
  get handlers(): Record<NextMethod, NextHandler | undefined> {
    const handler: NextHandler = async (req) => {
      const { response, args, success, error } =
        await this._router.dispatch(req);

      try {
        if (success) {
          for (const hook of this._hooks.afterResponse) {
            await hook(args as HandlerArgs<TContext>, response);
          }
        } else {
          throw error;
        }
        return response;
      } catch (error) {
        for (const hook of this._hooks.error) {
          const res = await hook(args as HandlerArgs<TContext>, error);
          if (res) {
            return res;
          }
        }
        throw error;
      }
    };

    return {
      GET: handler,
      POST: handler,
      PUT: handler,
      DELETE: handler,
      PATCH: handler,
      OPTIONS: handler,
      HEAD: handler,
    };
  }
}

export const { createRoute } = OpenAPIRouter;
