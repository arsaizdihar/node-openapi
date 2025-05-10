import { RouteFactory, RouteConfig } from '@node-openapi/core';
import { HapiRequestAdapter } from './request';
import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import { Server, Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import { ZodError } from 'zod';
export { z } from '@node-openapi/core';

export class HapiRouteFactory extends RouteFactory<HapiRequestAdapter> {
  private readonly _middlewares: Array<
    (request: Request, h: ResponseToolkit) => Promise<any>
  > = [];

  constructor(private readonly server: Server) {
    super();
  }

  middleware(handler: (request: Request, h: ResponseToolkit) => Promise<any>) {
    this._middlewares.push(handler);
  }

  route<R extends RouteConfig>(
    route: R,
    handler: (request: Request, h: ResponseToolkit) => Promise<any>,
  ) {
    if (route.method === 'head') {
      throw new Error('Hapi does not support the head method');
    }

    const _route = this._route(route);

    const serverRoute: ServerRoute = {
      method: route.method,
      path: route.path,
      handler: async (request, h) => {
        const context = {
          req: new HapiRequestAdapter(request),
          input: {},
        };

        try {
          // Run middlewares
          for (const middleware of this._middlewares) {
            await middleware(request, h);
          }

          const c = await _route(context);
          const input = c.input as any;
          (request as any).input = input;
          return handler(request, h);
        } catch (error) {
          if (error instanceof ZodError) {
            return h.response({ error }).code(400);
          }
          return h.response({ message: 'Internal Server Error' }).code(500);
        }
      },
    };

    this.server.route(serverRoute);
  }

  router(path: string, routeFactory: HapiRouteFactory) {
    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, routeFactory);
  }

  doc<P extends string>(path: P, configure: OpenAPIObjectConfigV31) {
    this.server.route({
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
}

export const { createRoute } = HapiRouteFactory;
