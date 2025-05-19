import { MaybePromise, mergePath } from '@node-openapi/core';
import { NextRequest, NextResponse } from 'next/server';
import { createRouter, RadixRouter } from 'radix3';
import { NextHandler } from './helper';

type Route = {
  method: string;
  path: string;
  handler: NextHandler<any, any>;
};

type RadixPayload = {
  middlewares: RouterMiddleware[];
  method: string;
  handler: NextHandler<any, any>;
};

export type RouteContext<
  TContext extends Record<string, unknown> = any,
  Input = unknown,
> = {
  params: Record<string, string | string[] | undefined>;
  context: TContext;
  input: Input;
};

export type RouterMiddleware = (
  req: NextRequest,
  ctx: RouteContext,
) => MaybePromise<void>;

export class Router {
  private _routes: Route[] = [];
  private _middlewares: RouterMiddleware[] = [];
  private _children: {
    path: string;
    router: Router;
  }[] = [];
  private _radixRouter: RadixRouter<RadixPayload> | null = null;

  add(method: string, path: string, handler: NextHandler<any, any>) {
    this._routes.push({
      method,
      path,
      handler,
    });
  }

  middleware(
    middleware: (req: NextRequest, ctx: RouteContext) => MaybePromise<void>,
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
    if (!match) {
      return {
        response: new NextResponse('Not Found', { status: 404 }),
        context: {
          params: {},
          context: {} as any,
          input: {},
        } as RouteContext<any, any>,
      };
    }
    const context = {
      params: match.params ?? {},
      context: {} as any,
      input: {} as any,
    } as RouteContext<any, any>;

    for (const middleware of match.middlewares) {
      await middleware(req, context);
    }

    const response = await match.handler(req, context);
    return { response, context };
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
