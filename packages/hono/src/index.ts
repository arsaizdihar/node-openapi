import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Context as CoreContext,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  OpenAPIDefinitions,
  RouteConfig,
  CoreOpenAPIRouter,
} from '@node-openapi/core';
import {
  Env,
  Handler,
  Hono,
  Context as HonoContext,
  Input,
  MiddlewareHandler,
  Next,
  ValidationTargets,
} from 'hono';
import { BlankEnv } from 'hono/types';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { HonoRequestAdapter } from './request';
import { HandlerWithTypedResponse, RouteConfigToTypedResponse } from './type';

export type OpenAPIRouterOptions = {
  app?: Hono<any>;
  validateResponse?: boolean;
};

/**
 * Router for Hono with OpenAPI support.
 * Integrates with `@node-openapi/core` for request validation and OpenAPI document generation.
 *
 * @template E - The Hono Environment type.
 *
 * @example
 * ```ts
 * import { Hono } from 'hono';
 * import { OpenAPIRouter, createRoute, z } from '@node-openapi/hono';
 *
 * const app = new Hono();
 * const router = new OpenAPIRouter<Bindings>(); // Bindings would be your Hono Env type
 *
 * const healthRoute = createRoute({
 *   method: 'get',
 *   path: '/health',
 *   getRoutingPath: () => '/health', // Hono path
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
 * router.route(healthRoute, (c) => {
 *   return c.typedJson({ status: 'ok' }, 200);
 * });
 *
 * router.doc('/openapi.json', {
 *   openapi: '3.1.0',
 *   info: { title: 'My Hono API', version: '1.0.0' },
 * });
 *
 * app.route('/', router.app); // Mount the OpenAPIRouter's Hono app
 *
 * export default app;
 * ```
 */
export class OpenAPIRouter<
  E extends Env = BlankEnv,
> extends CoreOpenAPIRouter<HonoRequestAdapter> {
  private readonly _middlewares: Array<MiddlewareHandler<E>> = [];
  public readonly app: Hono<E>;
  private readonly _validateResponse: boolean;

  /**
   * Creates a new OpenAPIRouter for Hono.
   * @param options - Options for the router.
   * @param options.app - An optional existing Hono application instance. If not provided, a new one is created.
   * @param options.validateResponse - Whether to validate responses using `c.typedJson` or `c.typedText`. Defaults to `true`.
   */
  constructor(options: OpenAPIRouterOptions = {}) {
    super();
    this.app = options.app ?? new Hono<E>();
    this._validateResponse = options.validateResponse ?? true;
  }

  /**
   * Extends the router, creating a new instance with a potentially different Hono Environment type (`NewEnv`).
   * Middlewares from the parent router are carried over to the new instance.
   * This is useful for creating a chain of routers or middlewares with evolving environment types.
   *
   * @param options - Options for the new router instance.
   * @param options.app - An optional Hono app instance for the new router. If not provided, a new one is created.
   * @param options.validateResponse - Whether to validate responses. Defaults to the parent router's setting.
   * @returns A new `OpenAPIRouter` instance with the specified `NewEnv` type.
   *
   * @example
   * ```ts
   * type EnvWithUser = { Variables: { user: { id: string } } };
   * const baseRouter = new OpenAPIRouter();
   * const authedRouter = baseRouter.extend<EnvWithUser>();
   * // authedRouter can now use middlewares and handlers expecting `c.var.user`
   * ```
   */
  extend<NewEnv extends Env>({
    app,
    validateResponse,
  }: OpenAPIRouterOptions = {}): OpenAPIRouter<NewEnv> {
    const router = new OpenAPIRouter<NewEnv>({
      app,
      validateResponse: validateResponse ?? this._validateResponse,
    });
    router._middlewares.push(
      ...(this._middlewares as unknown as MiddlewareHandler<NewEnv>[]),
    );
    return router;
  }

  /**
   * Adds a Hono middleware to this router instance.
   * These middlewares will be applied to all routes subsequently defined on this router instance using `.route()`.
   * They run before the core input validation and the main route handlers.
   *
   * @param handler - A Hono `MiddlewareHandler` compatible with the router's Environment type `E`.
   *
   * @example
   * ```ts
   * router.middleware(async (c, next) => {
   *   // Example: Attaching a user to Hono's context variables
   *   // if (c.env.Bindings && c.env.Bindings.USER_SERVICE) { ... }
   *   // c.set('user', fetchedUser);
   *   console.log('Middleware running!');
   *   await next();
   * });
   * ```
   */
  middleware(handler: MiddlewareHandler<E>) {
    this._middlewares.push(handler);
  }

  /**
   * Defines a route on the Hono application associated with this router.
   * It applies previously registered middlewares, then performs input validation based on `routeConfig`,
   * and finally executes the provided Hono handlers.
   * The Hono context `c` is augmented with `typedJson` and `typedText` methods for type-safe responses
   * (if `validateResponse` is true).
   *
   * @param routeConfig - The route configuration object, created using `createRoute`.
   *                      It must include `getRoutingPath()` returning the Hono-compatible path string.
   * @param handlers - One or more Hono `Handler` functions. These handlers will receive a Hono context `c`
   *                   where `c.req.valid('param' | 'query' | 'json' | ...)` can be used to access validated data.
   *                   They should use `c.typedJson()` or `c.typedText()` for responses to enable validation.
   *
   * @example
   * ```ts
   * const getUserRoute = createRoute({
   *   method: 'get',
   *   path: '/users/{id}', // OpenAPI path
   *   getRoutingPath: () => '/users/:id', // Hono path
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
   * router.route(getUserRoute, (c) => {
   *   const { id } = c.req.valid('param');
   *   // const user = await findUser(id, c.env.DB);
   *   // if (!user) return c.typedText('Not Found', 404);
   *   return c.typedJson({ id, name: 'John Doe' }, 200);
   * });
   * ```
   */
  route<
    R extends RouteConfig & { getRoutingPath: () => string },
    ValidationInput extends Input = InputTypeParam<R> &
      InputTypeQuery<R> &
      InputTypeHeader<R> &
      InputTypeCookie<R> &
      InputTypeForm<R> &
      InputTypeJson<R>,
  >(
    routeConfig: R,
    ...handlers: HandlerWithTypedResponse<
      R,
      E,
      R['path'],
      ValidationInput,
      RouteConfigToTypedResponse<R>
    >[]
  ) {
    const _coreRouteProcessor = this._route(routeConfig);

    this.app.on(
      [routeConfig.method],
      routeConfig.getRoutingPath(),
      async (c: HonoContext<E>, next) => {
        const helper = OpenAPIRouter._createHelper(
          {
            json: (data: any, status: ContentfulStatusCode) => {
              return c.json(data, status) as any;
            },
            text: (data: string, status: ContentfulStatusCode) => {
              return c.text(data, status) as any;
            },
          },
          this._validateResponse ? routeConfig : undefined,
        );
        (c as any).typedJson = helper.json;
        (c as any).typedText = helper.text;
        return next();
      },
      ...this._middlewares,
      async (c: HonoContext<E>, next: Next) => {
        const coreProcessingContext: CoreContext<HonoRequestAdapter> = {
          req: new HonoRequestAdapter(c.req),
          input: {},
        };

        const validationResult = await _coreRouteProcessor(
          coreProcessingContext,
        );
        const validatedData = validationResult.input as any;

        for (const key in validatedData) {
          if (validatedData[key] !== undefined) {
            c.req.addValidatedData(
              key as keyof ValidationTargets,
              validatedData[key],
            );
          }
        }
        await next();
      },
      ...(handlers as Handler[]),
    );
  }

  /**
   * Registers a GET route on the Hono app to serve the OpenAPI documentation.
   *
   * @param path - The path where the OpenAPI document will be served (e.g., '/openapi.json').
   * @param openapiConfig - The base OpenAPI configuration object (from `@asteasolutions/zod-to-openapi`).
   * @param additionalDefinitions - Optional array of additional Zod schemas to include in the components section of the OpenAPI document.
   *
   * @example
   * ```ts
   * router.doc('/api/v1/openapi.json', {
   *   openapi: '3.1.0',
   *   info: {
   *     title: 'My Awesome API',
   *     version: '1.0.0',
   *   },
   * });
   * ```
   */
  doc<P extends string>(
    path: P,
    openapiConfig: OpenAPIObjectConfigV31,
    additionalDefinitions?: OpenAPIDefinitions[],
  ): void {
    this.app.get(path, (c: HonoContext<E>) => {
      const document = this.getOpenAPIDocument(
        openapiConfig,
        additionalDefinitions,
      );
      return c.json(document);
    });
  }

  /**
   * Mounts another `OpenAPIRouter`'s Hono application instance as a sub-router under a specified path.
   * This allows for modular composition of Hono applications.
   * OpenAPI definitions from the sub-router are merged into the parent router's definitions.
   *
   * @param path - The base path under which the sub-router will be mounted (e.g., '/admin').
   * @param subRouter - The `OpenAPIRouter` instance whose Hono app (`subRouter.app`) will be mounted.
   *
   * @example
   * ```ts
   * const adminRouter = new OpenAPIRouter();
   * // Define routes on adminRouter.app ...
   *
   * mainRouter.use('/admin', adminRouter);
   * // Now adminRouter.app handles requests to /admin/*
   * ```
   */
  use<SubEnv extends Env>(path: string, subRouter: OpenAPIRouter<SubEnv>) {
    this.app.route(path, subRouter.app as Hono<any>);

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, subRouter);
  }
}

export const { createRoute } = OpenAPIRouter;

export { z } from '@node-openapi/core';
export type { OpenAPIDefinitions, RouteConfig };
