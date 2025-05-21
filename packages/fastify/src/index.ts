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
  RouteConfig,
  CoreOpenAPIRouter,
} from '@node-openapi/core';
import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteOptions,
} from 'fastify';
import { FastifyRequestAdapter } from './request';
export { OpenAPIDefinitions, RouteConfig, z } from '@node-openapi/core';

type RouteHandlerMethodWithContext<Context extends Record<string, any>> = (
  request: FastifyRequest,
  reply: FastifyReply,
  { context }: { context: Context },
) => Promise<void>;

const INTERNAL = Symbol('INTERNAL');

function getInternal(request: FastifyRequest) {
  // @ts-expect-error internal symbol
  let c = request[INTERNAL];
  if (!c) {
    c = {
      context: {},
    };
    // @ts-expect-error internal symbol
    request[INTERNAL] = c;
  }
  return c;
}

class Router {
  private routes: Array<RouteOptions> = [];

  middlewares: Array<
    (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  > = [];

  route(opts: RouteOptions) {
    this.routes.push(opts);
  }

  middleware(handler: RouteHandlerMethodWithContext<any>) {
    this.middlewares.push(async (request, reply) => {
      const c = getInternal(request);
      await handler(request, reply, { context: c.context });
    });
  }

  registerApp(app: FastifyInstance) {
    this.routes.forEach((route) => {
      const preHandlerArray =
        route.preHandler instanceof Array
          ? route.preHandler
          : route.preHandler
            ? [route.preHandler]
            : [];
      app.route({
        ...route,
        preHandler: [...this.middlewares, ...preHandlerArray],
      });
    });
  }

  registerRouter(path: string, router: Router) {
    router.routes.forEach((route) => {
      const preHandlerArray =
        route.preHandler instanceof Array
          ? route.preHandler
          : route.preHandler
            ? [route.preHandler]
            : [];
      this.routes.push({
        ...route,
        preHandler: [...router.middlewares, ...preHandlerArray],
        url:
          path.endsWith('/') && route.url.startsWith('/')
            ? path + route.url.slice(1)
            : path + route.url,
      });
    });
  }
}

export type OpenAPIRouterOptions = {
  /**
   * Whether to validate the response in the h helper
   * @default true
   */
  validateResponse?: boolean;
};

/**
 * Router for Fastify with OpenAPI support.
 *
 * @example
 * ```ts
 * const app = fastify();
 * const router = new OpenAPIRouter();
 *
 * router.route(
 *   {
 *     method: 'get',
 *     path: '/hello',
 *     getRoutingPath: () => '/hello',
 *     responses: {
 *       200: {
 *         description: 'Successful response',
 *         content: {
 *           'application/json': {
 *             schema: z.object({ message: z.string() }),
 *           },
 *         },
 *       },
 *     },
 *   },
 *   async ({ h }) => {
 *     h.json({ message: 'Hello, world!' });
 *   },
 * );
 *
 * router.registerApp(app);
 * ```
 */
export class OpenAPIRouter<
  TContext extends Record<string, any> = Record<string, any>,
> extends CoreOpenAPIRouter<FastifyRequestAdapter> {
  private readonly _router: Router = new Router();
  private readonly _validateResponse: boolean;

  /**
   * Create a new OpenAPIRouter for Fastify.
   * @param options - Options for the router.
   * @param options.validateResponse - Whether to validate the response in the h helper. Defaults to true.
   */
  constructor(options: OpenAPIRouterOptions = {}) {
    super();
    this._validateResponse = options.validateResponse ?? true;
  }

  /**
   * Extend the router with a new context. It will create a new instance with the current middlewares as the initial new middlewares.
   * @param options - Options for the router.
   * @param options.validateResponse - Whether to validate the response in the h helper. Defaults to the parent router's setting.
   *
   * @example
   * ```ts
   * const authedRouter = publicRouter.extend<{ user: { id: string } }>();
   * ```
   */
  extend<NewContext extends TContext>({
    validateResponse,
  }: OpenAPIRouterOptions = {}): OpenAPIRouter<TContext & NewContext> {
    const router = new OpenAPIRouter<TContext & NewContext>({
      validateResponse: validateResponse ?? this._validateResponse,
    });
    router._router.middlewares = [...this._router.middlewares];
    return router;
  }

  /**
   * Add a middleware to the router. It will be applied to all routes registered after this middleware.
   * The context can be modified in the middleware and will be available in subsequent middlewares and the route handler.
   *
   * @param handler - The middleware handler function.
   *
   * @example
   * ```ts
   * router.middleware(async (request, reply, { context }) => {
   *   // Assuming context is typed as { user?: { id: string } }
   *   const userId = request.headers['x-user-id'];
   *   if (typeof userId === 'string') {
   *     context.user = { id: userId };
   *   }
   * });
   * ```
   */
  middleware<R extends RouteHandlerMethodWithContext<TContext>>(handler: R) {
    this._router.middleware(handler);
  }

  /**
   * Add a route to the router.
   *
   * @param route - The route configuration object, created using `createRoute`.
   * @param handler - The route handler function. It receives the request context, validated input, Fastify request and reply objects, and a helper object `h` for sending responses.
   *
   * @example
   * ```ts
   * const userSchema = z.object({
   *   id: z.string(),
   *   name: z.string(),
   * });
   *
   * router.route(
   *   createRoute({
   *     method: 'get',
   *     path: '/users/{id}',
   *     getRoutingPath: () => '/users/:id', // Fastify specific path format
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
   *       404: {
   *         description: 'User not found',
   *       },
   *     },
   *   }),
   *   async ({ input, h, context }) => {
   *     // const user = await findUserById(input.params.id, context.db);
   *     // if (!user) {
   *     //   return h.json({ message: 'User not found' }, 404);
   *     // }
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
    handler: ({
      context,
      input,
      request,
      reply,
    }: {
      context: TContext;
      input: I['out'];
      request: FastifyRequest;
      reply: FastifyReply;
      h: Helper<R>;
    }) => MaybePromise<void>,
  ) {
    const _route = this._route(route);

    this._router.route({
      method: route.method,
      url: route.getRoutingPath(),
      preHandler: [
        async (request, _reply) => {
          const context: Context<FastifyRequestAdapter> = {
            req: new FastifyRequestAdapter(request),
            input: {},
          };

          const validatorContext = await _route(context);
          const c = getInternal(request);
          c.input = validatorContext.input;
        },
      ],
      handler: async (request, reply) => {
        const c = getInternal(request);
        await handler({
          context: c.context,
          input: c.input,
          request,
          reply,
          h: OpenAPIRouter._createHelper(
            {
              json: (data, status) => {
                reply
                  .header('Content-Type', 'application/json')
                  .status(status)
                  .send(data);
              },
              text: (data, status) => {
                reply
                  .header('Content-Type', 'text/plain')
                  .status(status)
                  .send(data);
              },
            },
            this._validateResponse ? route : undefined,
          ),
        });
      },
    });
  }

  /**
   * Mount a sub-router at a specific path prefix.
   * All routes defined in the sub-router will be prefixed with this path.
   * Middlewares from the parent router will be applied to the sub-router's routes.
   *
   * @param path - The path prefix for the sub-router.
   * @param router - The `OpenAPIRouter` instance to mount.
   *
   * @example
   * ```ts
   * const userRouter = new OpenAPIRouter();
   * // Define routes on userRouter...
   *
   * mainRouter.use('/users', userRouter);
   * ```
   */
  use<TContext extends Record<string, any>>(
    path: string,
    router: OpenAPIRouter<TContext>,
  ) {
    this._router.registerRouter(path, router._router);

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, router);
  }

  /**
   * Register a route to serve the OpenAPI documentation (e.g., in JSON format).
   *
   * @param path - The path where the OpenAPI documentation will be served (e.g., '/openapi.json').
   * @param configure - The OpenAPI configuration object.
   *
   * @example
   * ```ts
   * router.doc('/openapi.json', {
   *   openapi: '3.1.0',
   *   info: {
   *     title: 'My API',
   *     version: '1.0.0',
   *   },
   * });
   * ```
   */
  doc<P extends string>(path: P, configure: OpenAPIObjectConfigV31) {
    this._router.route({
      method: 'get',
      url: path,
      handler: async (_, reply) => {
        try {
          const document = this.getOpenAPIDocument(configure);
          return reply.send(document);
        } catch (error) {
          return reply.status(500).send({
            error: error,
          });
        }
      },
    });
  }

  /**
   * Register all defined routes and middlewares with the Fastify application instance.
   * This method should be called after all routes and middlewares have been defined on the router.
   *
   * @param app - The Fastify application instance.
   *
   * @example
   * ```ts
   * const app = fastify();
   * const router = new OpenAPIRouter();
   * // Define routes and middlewares on the router...
   * router.registerApp(app);
   * ```
   */
  registerApp(app: FastifyInstance) {
    this._router.registerApp(app);
  }
}

export const { createRoute } = OpenAPIRouter;
