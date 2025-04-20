import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Context,
  HandlerResponse,
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
import {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from 'fastify';
import { FastifyRequestAdapter } from './request';

export class FastifyRouteFactory extends RouteFactory<FastifyRequestAdapter> {
  private readonly _middlewares: Array<RouteHandlerMethod> = [];

  constructor(private readonly _app: FastifyInstance) {
    super();
  }

  middleware<R extends RouteHandlerMethod>(handler: R) {
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
    handler: (
      request: FastifyRequest,
      reply: FastifyReply,
      input: I['out'],
    ) =>
      | Promise<Omit<RouteConfigToHandlerResponse<R>, 'format'>>
      | Omit<RouteConfigToHandlerResponse<R>, 'format'>,
  ) {
    const _route = this._route(route);

    this._app.route({
      method: route.method,
      url: route.path,
      preHandler: [
        ...this._middlewares,
        async (request, _reply) => {
          const context: Context<FastifyRequestAdapter> = {
            req: new FastifyRequestAdapter(request),
            input: {},
          };

          const c = await _route(context);
          const input = c.input as any;
          request.routeConfig = {
            ...request.routeConfig,
            ...input,
          };
        },
      ],
      handler: async (request, reply) => {
        const input = request.routeConfig as I['out'];
        const result = await handler(request, reply, input);
        const response = result as Omit<
          HandlerResponse<any, any, any>,
          'format'
        >;
        return reply.status(response.status).send(response.data);
      },
    });
  }

  router(path: string, routeFactory: FastifyRouteFactory) {
    const plugin: FastifyPluginCallback = (fastify, _, done) => {
      if (this._middlewares.length > 0) {
        this._middlewares.forEach((middleware) => {
          fastify.addHook('preHandler', middleware);
        });
      }
      fastify.register(async (app) => {
        Object.assign(app, routeFactory._app);
      });
      done();
    };

    this._app.register(plugin, { prefix: path });

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, routeFactory);
  }

  doc<P extends string>(path: P, configure: OpenAPIObjectConfigV31) {
    this._app.get(path, async (_, reply) => {
      try {
        const document = this.getOpenAPIDocument(configure);
        return reply.send(document);
      } catch (error) {
        return reply.status(500).send({
          error: error,
        });
      }
    });
  }
}

export const { createRoute } = FastifyRouteFactory;

// Add type augmentation for Fastify
declare module 'fastify' {
  interface FastifyRequest {
    routeConfig?: Record<string, any>;
  }
}
