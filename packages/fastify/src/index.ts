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
  RouteFactory,
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

export class FastifyRouteFactory<
  TContext extends Record<string, any> = Record<string, any>,
> extends RouteFactory<FastifyRequestAdapter> {
  private readonly _router: Router = new Router();
  private readonly _validateResponse: boolean;

  constructor(options: { validateResponse?: boolean } = {}) {
    super();
    this._validateResponse = options.validateResponse ?? true;
  }

  extend<NewContext extends TContext>(): FastifyRouteFactory<
    TContext & NewContext
  > {
    const factory = new FastifyRouteFactory<TContext & NewContext>({
      validateResponse: this._validateResponse,
    });
    factory._router.middlewares = [...this._router.middlewares];
    return factory;
  }

  middleware<R extends RouteHandlerMethodWithContext<TContext>>(handler: R) {
    this._router.middleware(handler);
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
          h: FastifyRouteFactory._createHelper(
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

  router<TContext extends Record<string, any>>(
    path: string,
    routeFactory: FastifyRouteFactory<TContext>,
  ) {
    this._router.registerRouter(path, routeFactory._router);

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, routeFactory);
  }

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

  registerApp(app: FastifyInstance) {
    this._router.registerApp(app);
  }
}

export const { createRoute } = FastifyRouteFactory;
