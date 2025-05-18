import { RouteFactory, RouteConfig } from '@node-openapi/core';
import { HapiRequestAdapter } from './request';
import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Request,
  ResponseToolkit,
  ServerRoute,
  Plugin,
  Server,
} from '@hapi/hapi';
export { z } from '@node-openapi/core';

type InternalPluginOptions = {
  middlewares?: Array<(request: Request, h: ResponseToolkit) => Promise<any>>;
};

export class HapiRouteFactory extends RouteFactory<HapiRequestAdapter> {
  private readonly _middlewares: Array<
    (request: Request, h: ResponseToolkit) => Promise<any>
  > = [];

  private plugin: Plugin<InternalPluginOptions, unknown>;
  private children: { path: string; factory: HapiRouteFactory }[] = [];
  private routes: ServerRoute[] = [];

  constructor(name?: string) {
    super();

    this.plugin = {
      name:
        name || 'node-openapi-' + Math.random().toString(36).substring(2, 15),
      register: (server, options) => {
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
          server.register(
            {
              plugin: child.factory.plugin,
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

  middleware(handler: (request: Request, h: ResponseToolkit) => Promise<any>) {
    this._middlewares.push(handler);
  }

  route<R extends RouteConfig & { getRoutingPath: () => string }>(
    route: R,
    handler: (request: Request, h: ResponseToolkit) => Promise<any>,
  ) {
    if (route.method === 'head') {
      throw new Error('Hapi does not support the head method');
    }

    const _route = this._route(route);

    const serverRoute: ServerRoute = {
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

        const c = await _route(context);
        const input = c.input as any;
        (request as any).input = input;
        return handler(request, h);
      },
    };

    this.routes.push(serverRoute);
  }

  router(path: string, routeFactory: HapiRouteFactory) {
    this.children.push({ path, factory: routeFactory });
    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, routeFactory);
  }

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

  registerServer(server: Server) {
    server.register(this.plugin);
  }
}

export const { createRoute } = HapiRouteFactory;
