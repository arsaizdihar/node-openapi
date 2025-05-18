import { RouteFactory, RouteConfig } from '@node-openapi/core';
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
} from '@hapi/hapi';
export { z } from '@node-openapi/core';

type InternalPluginOptions<TRefs extends ReqRef> = {
  middlewares?: RouteOptionsPreArray<TRefs>;
};

export class HapiRouteFactory<
  TContext extends Record<string, any>,
  TRefs extends ReqRefDefaults & { RequestApp: TContext } = ReqRefDefaults & {
    RequestApp: TContext;
  },
> extends RouteFactory<HapiRequestAdapter> {
  private _middlewares: RouteOptionsPreArray<TRefs> = [];

  private plugin: Plugin<InternalPluginOptions<TRefs>, unknown>;
  private children: { path: string; factory: HapiRouteFactory<TRefs> }[] = [];
  private routes: ServerRoute<TRefs>[] = [];

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
              plugin: child.factory.plugin as any,
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

  extend<NewContext extends TContext>(): HapiRouteFactory<NewContext> {
    const factory = new HapiRouteFactory<NewContext>();
    factory._middlewares = [
      ...this._middlewares,
    ] as unknown as typeof factory._middlewares;
    return factory;
  }

  middleware(handler: RouteOptionsPreAllOptions<TRefs>) {
    this._middlewares.push(handler);
  }

  route<R extends RouteConfig & { getRoutingPath: () => string }>(
    route: R,
    handler: (
      request: Request<TRefs>,
      h: ResponseToolkit<TRefs>,
    ) => Promise<any>,
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

        const c = await _route(context);
        const input = c.input as any;
        (request as any).input = input;
        return handler(request, h);
      },
    };

    this.routes.push(serverRoute);
  }

  router<NewContext extends TContext>(
    path: string,
    routeFactory: HapiRouteFactory<NewContext>,
  ) {
    this.children.push({ path, factory: routeFactory as any });
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
