import {
  CoreOpenAPIRouter,
  RouteConfig,
  InputTypeQuery,
  InputTypeParam,
  InputTypeHeader,
  InputTypeCookie,
  InputTypeJson,
  InputTypeForm,
  Input,
  Helper,
} from '@node-openapi/core';
import { HapiRequestAdapter } from './request';
import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Request,
  ResponseToolkit,
  ServerRoute,
  Plugin,
  Server,
  RouteOptionsPreArray,
  ReqRef,
  RouteOptionsPreAllOptions,
  ReqRefDefaults,
  ResponseObject,
} from '@hapi/hapi';
export { z, OpenAPIDefinitions, RouteConfig } from '@node-openapi/core';

type InternalPluginOptions<TRefs extends ReqRef> = {
  middlewares?: RouteOptionsPreArray<TRefs>;
};

export type OpenAPIRouterOptions = {
  /**
   * The name of the router.
   * @default 'node-openapi-' + Math.random().toString(36).substring(2, 15)
   */
  name?: string;
  /**
   * Whether to validate the response.
   * @default true
   */
  validateResponse?: boolean;
};

/**
 * Router for Hapi with OpenAPI support.
 *
 * @example
 * ```ts
 * import Hapi from '@hapi/hapi';
 * import { OpenAPIRouter, createRoute, z } from '@node-openapi/hapi';
 *
 * const init = async () => {
 *   const server = Hapi.server({ port: 3000 });
 *   const router = new OpenAPIRouter<{ appSpecificContext: string }>();
 *
 *   router.route(
 *     createRoute({
 *       method: 'get',
 *       path: '/hello',
 *       responses: {
 *         200: {
 *           description: 'Successful response',
 *           content: {
 *             'application/json': {
 *               schema: z.object({ message: z.string() }),
 *             },
 *           },
 *         },
 *       },
 *     }),
 *     async ({ h, context }) => {
 *       // context.appSpecificContext can be used here if set in a middleware
 *       return h.json({ message: 'Hello, world!' });
 *     },
 *   );
 *
 *   await router.registerServer(server);
 *   await server.start();
 *   console.log('Server running on %s', server.info.uri);
 * };
 *
 * init();
 * ```
 */
export class OpenAPIRouter<
  TContext extends Record<string, any>,
  TRefs extends ReqRefDefaults & { RequestApp: TContext } = ReqRefDefaults & {
    RequestApp: TContext;
  },
> extends CoreOpenAPIRouter<HapiRequestAdapter> {
  private _middlewares: RouteOptionsPreArray<TRefs> = [];

  private plugin: Plugin<InternalPluginOptions<TRefs>, unknown>;
  private children: { path: string; router: OpenAPIRouter<TRefs> }[] = [];
  private routes: ServerRoute<TRefs>[] = [];
  private _validateResponse: boolean;

  /**
   * Create a new OpenAPIRouter for Hapi.
   * @param options - Options for the router.
   * @param options.name - The name of the Hapi plugin for this router. Defaults to a random string.
   * @param options.validateResponse - Whether to validate the response in the h helper. Defaults to true.
   */
  constructor(options: OpenAPIRouterOptions = {}) {
    super();
    this._validateResponse = options.validateResponse ?? true;
    const name =
      options.name ||
      'node-openapi-' + Math.random().toString(36).substring(2, 15);

    this.plugin = {
      name,
      register: async (server, options) => {
        for (const route of this.routes) {
          let routeOptions = route.options;
          if (typeof routeOptions === 'function') {
            routeOptions = routeOptions(server);
          }

          server.route({
            ...route,
            options: {
              ...routeOptions,
              pre: [
                // middlewares from parent plugin
                ...(options?.middlewares || []),
                // middlewares from this plugin
                ...(routeOptions?.pre || []),
              ],
            },
          });
        }

        for (const child of this.children) {
          await server.register(
            {
              plugin: child.router.plugin as any,
              options: {
                middlewares: [
                  // middlewares from parent plugin
                  ...(options?.middlewares || []),
                  // middlewares from this plugin
                  ...this._middlewares,
                ],
              },
            },
            {
              routes: {
                prefix: child.path,
              },
            },
          );
        }
      },
    };
  }

  /**
   * Extend the router with a new context type. This creates a new `OpenAPIRouter` instance
   * that inherits middlewares from the parent router.
   * Useful for creating routers with more specific context types after applying certain middlewares.
   *
   * @returns A new `OpenAPIRouter` instance with the new context type.
   *
   * @example
   * ```ts
   * const baseRouter = new OpenAPIRouter<{ requestID: string }>();
   * // Add middleware to baseRouter that sets requestID
   *
   * const userRouter = baseRouter.extend<{ user: { id: string } }>();
   * // userRouter now has context type { requestID: string; user: { id: string } }
   * // Add middleware to userRouter that sets user
   * ```
   */
  extend<NewContext extends TContext>({
    validateResponse,
  }: OpenAPIRouterOptions = {}): OpenAPIRouter<NewContext> {
    const router = new OpenAPIRouter<NewContext>({
      validateResponse: validateResponse ?? this._validateResponse,
    });
    router._middlewares = [
      ...this._middlewares,
    ] as unknown as typeof router._middlewares;
    return router;
  }

  /**
   * Add a Hapi pre-handler (middleware) to this router instance.
   * These middlewares will be applied to all routes defined directly on this router instance
   * and also to routes in sub-routers mounted via `.use()`.
   * The `request.app` object can be used to pass data between middlewares and to the main handler,
   * corresponding to the `TContext` type of the router.
   *
   * @param handler - A Hapi `RouteOptionsPreAllOptions` object or an array thereof.
   *                See Hapi documentation for pre-handler options: https://hapi.dev/api/?v=21.3.9#-routeoptionspre
   *
   * @example
   * ```ts
   * router.middleware({
   *   assign: 'user',
   *   method: async (request, h) => {
   *     const userId = request.headers['x-user-id'];
   *     // Assuming TContext is { user?: { id: string } }
   *     if (typeof userId === 'string') {
   *       request.app.user = { id: userId }; // request.app is TContext
   *     }
   *     return h.continue;
   *   }
   * });
   * ```
   */
  middleware(handler: RouteOptionsPreAllOptions<TRefs>) {
    this._middlewares.push(handler);
  }

  /**
   * Define a route with a handler.
   * The route configuration is created using `createRoute` (or the static `OpenAPIRouter.createRoute`).
   * The handler receives validated input, the Hapi request object, the Hapi response toolkit (`h`) augmented with `json` and `text` helpers, and the typed context.
   *
   * @param route - The route configuration object from `createRoute`.
   * @param handler - The asynchronous route handler function.
   *
   * @example
   * ```ts
   * const userSchema = z.object({ id: z.string(), name: z.string() });
   * router.route(
   *   OpenAPIRouter.createRoute({
   *     method: 'get',
   *     path: '/users/{id}', // Hapi path uses {param}
   *     request: {
   *       params: z.object({ id: z.string() }),
   *     },
   *     responses: {
   *       200: {
   *         description: 'User found',
   *         content: {
   *           'application/json': {
   *             schema: userSchema,
   *           },
   *         },
   *       },
   *     },
   *   }),
   *   async ({ input, h, req, context }) => {
   *     // const user = await findUserById(input.params.id, context.db);
   *     // return h.json(user);
   *     return h.json({ id: input.params.id, name: 'John Doe' });
   *   },
   * );
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
    handler: (args: {
      input: I['out'];
      h: ResponseToolkit<TRefs> & Helper<R, ResponseObject>;
      req: Request<TRefs>;
      context: TContext;
    }) => Promise<ResponseObject>,
  ) {
    if (route.method === 'head') {
      throw new Error('Hapi does not support the head method');
    }

    const _route = this._route(route);

    const serverRoute: ServerRoute<TRefs> = {
      method: route.method,
      path: route.getRoutingPath(),
      options: {
        pre: this._middlewares,
      },
      handler: async (request, h) => {
        const context = {
          req: new HapiRequestAdapter(request),
          input: {},
        };

        const helper = OpenAPIRouter._createHelper<R, ResponseObject>(
          {
            json: (data, status) => {
              return h
                .response(data)
                .code(status)
                .header('Content-Type', 'application/json');
            },
            text: (data, status) => {
              return h
                .response(data)
                .code(status)
                .header('Content-Type', 'text/plain');
            },
          },
          this._validateResponse ? route : undefined,
        );

        (h as any).json = helper.json;
        (h as any).text = helper.text;

        const c = await _route(context);
        return handler({
          req: request,
          input: c.input as I['out'],
          h: h as ResponseToolkit<TRefs> & Helper<R, ResponseObject>,
          context: request.app as TContext,
        });
      },
    };

    this.routes.push(serverRoute);
  }

  /**
   * Mount a sub-router under a specific path prefix.
   * Routes defined in the sub-router will be prefixed with this path.
   * Middlewares (pre-handlers) from this parent router will be passed down and applied to the sub-router's routes.
   * The OpenAPI definitions from the sub-router will be merged.
   *
   * @param path - The path prefix for the sub-router (e.g., '/users').
   * @param router - The `OpenAPIRouter` instance to mount.
   *
   * @example
   * ```ts
   * const userRouter = new OpenAPIRouter();
   * // Define routes on userRouter...
   *
   * mainRouter.use('/api', userRouter);
   * ```
   */
  use<NewContext extends TContext>(
    path: string,
    router: OpenAPIRouter<NewContext>,
  ) {
    this.children.push({ path, router: router as any });
    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, router);
  }

  /**
   * Register a route to serve the OpenAPI documentation (e.g., in JSON format).
   *
   * @param path - The path where the OpenAPI documentation will be served (e.g., '/openapi.json').
   * @param configure - The OpenAPI configuration object (from `@asteasolutions/zod-to-openapi`).
   *
   * @example
   * ```ts
   * router.doc('/docs.json', {
   *   openapi: '3.1.0',
   *   info: {
   *     title: 'My API',
   *     version: '1.0.0',
   *   },
   * });
   * ```
   */
  doc<P extends string>(path: P, configure: OpenAPIObjectConfigV31) {
    this.routes.push({
      method: 'get',
      path,
      handler: (_, h) => {
        try {
          const document = this.getOpenAPIDocument(configure);
          return h.response(document).type('application/json');
        } catch (error) {
          return h.response({ error }).code(500);
        }
      },
    });
  }

  /**
   * Register this router and all its routes and sub-routers as a plugin with the Hapi server.
   * This method should be called after all routes, middlewares, and sub-routers have been defined.
   *
   * @param server - The Hapi server instance.
   * @returns A promise that resolves when the plugin is registered.
   *
   * @example
   * ```ts
   * const server = Hapi.server({ port: 3000 });
   * const router = new OpenAPIRouter();
   * // ... define routes, middlewares, use sub-routers ...
   * await router.registerServer(server);
   * await server.start();
   * ```
   */
  async registerServer(server: Server) {
    return server.register(this.plugin);
  }

  /**
   * Static factory method to create a route configuration object.
   * Importantly, for Hapi, the `path` property in the `RouteConfig` should use Hapi's path parameter syntax (e.g., '/users/{id}').
   * This method simply returns the provided config along with a `getRoutingPath` function that returns the same path,
   * as Hapi and OpenAPI use compatible path parameter syntax.
   *
   * @param routeConfig - The route configuration.
   * @returns The route configuration augmented with a `getRoutingPath` method.
   *
   * @example
   * ```ts
   * const getArticleRoute = OpenAPIRouter.createRoute({
   *   method: 'get',
   *   path: '/articles/{slug}', // Path for both OpenAPI and Hapi
   *   request: {
   *     params: z.object({ slug: z.string() }),
   *   },
   *   responses: { // ... responses ... }
   * });
   * ```
   */
  static createRoute<R extends RouteConfig>(
    routeConfig: R,
  ): R & { getRoutingPath: () => string } {
    return {
      ...routeConfig,
      getRoutingPath: () => routeConfig.path,
    };
  }
}

export const { createRoute } = OpenAPIRouter;
