import { MaybePromise, mergePath } from '@node-openapi/core';
import { NextRequest, NextResponse } from 'next/server';
import { createRouter, RadixRouter } from 'radix3';

export type HandlerArgs<
  TContext extends Record<string, unknown> = any,
  Extend = unknown,
> = {
  req: NextRequest;
  params: Record<string, string | string[] | undefined>;
  context: TContext;
} & Extend;

export type RouteHandler<
  TContext extends Record<string, unknown> = any,
  Extend = unknown,
  TResp = any,
> = (args: HandlerArgs<TContext, Extend>) => MaybePromise<NextResponse<TResp>>;

type RadixPayload = {
  middlewares: RouterMiddleware[];
  method: string;
  handler: RouteHandler;
};

type Route = {
  method: string;
  path: string;
  handler: RouteHandler;
};

export type RouterMiddleware = (
  args: HandlerArgs,
) => MaybePromise<NextResponse | void>;

export class Router {
  private _routes: Route[] = [];
  private _middlewares: RouterMiddleware[] = [];
  private _children: {
    path: string;
    router: Router;
  }[] = [];
  private _radixRouter: RadixRouter<RadixPayload> | null = null;

  add(
    method: string,
    path: string,
    handler: (args: HandlerArgs) => MaybePromise<NextResponse>,
  ) {
    this._routes.push({
      method,
      path,
      handler,
    });
  }

  middleware(
    middleware: (args: HandlerArgs) => MaybePromise<NextResponse | void>,
  ) {
    this._middlewares.push(middleware);
  }

  use(path: string, router: Router) {
    this._children.push({
      path,
      router,
    });
  }

  build() {
    if (this._radixRouter) {
      return this._radixRouter;
    }

    const radixRouter = createRouter<RadixPayload>();
    const matches = new Set<string>();

    for (const route of this._routes) {
      const match = this.toMatchString(route.method, route.path);
      if (matches.has(match)) {
        throw new Error(`Duplicate route: ${match}`);
      }
      matches.add(match);
      radixRouter.insert(match, {
        middlewares: this._middlewares,
        handler: route.handler,
        method: route.method,
      });
    }

    // Process children routers using BFS
    const queue = [...this._children];
    while (queue.length > 0) {
      const { path: basePath, router } = queue.shift()!;

      // Add child routes with merged paths and middlewares
      for (const route of router._routes) {
        const fullPath = mergePath(basePath, route.path);
        const match = this.toMatchString(route.method, fullPath);
        if (matches.has(match)) {
          throw new Error(`Duplicate route: ${match}`);
        }
        matches.add(match);
        radixRouter.insert(match, {
          middlewares: [...this._middlewares, ...router._middlewares],
          handler: route.handler,
          method: route.method,
        });
      }

      // Add child's children to queue
      for (const childRouter of router._children) {
        queue.push({
          path: mergePath(basePath, childRouter.path),
          router: childRouter.router,
        });
      }
    }

    this._radixRouter = radixRouter;
    return radixRouter;
  }

  async dispatch(req: NextRequest) {
    const radixRouter = this.build();
    const match = radixRouter.lookup(
      this.toMatchString(req.method.toLowerCase(), req.nextUrl.pathname),
    );

    const context = {};
    const params = match?.params ?? {};
    const args = { req, params, context };

    try {
      if (!match) {
        return {
          success: true as const,
          response: new NextResponse('Not Found', { status: 404 }),
          args,
        };
      }

      for (const middleware of match.middlewares) {
        const res = await middleware(args);
        if (res) {
          return {
            success: true as const,
            response: res,
            args,
          };
        }
      }

      const response = await match.handler(args);
      return {
        success: true as const,
        response,
        args,
      };
    } catch (error) {
      return {
        success: false as const,
        error,
        args,
      };
    }
  }

  private toMatchString(method: string, path: string) {
    return `${method} ${path}`;
  }

  copy() {
    const router = new Router();
    router._routes = [...this._routes];
    router._middlewares = [...this._middlewares];
    router._children = [...this._children];
    return router;
  }
}
