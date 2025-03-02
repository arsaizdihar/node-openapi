import {
  InputTypeQuery,
  InputTypeHeader,
  InputTypeCookie,
  InputTypeForm,
  InputTypeJson,
  RouteConfig,
  RouteFactory,
  Input,
  InputTypeParam,
  Context,
} from '@node-openapi/core';
import Koa from 'koa';
import { KoaRequestAdapter } from './request';
import bodyParser from '@koa/bodyparser';
import Router, { IMiddleware } from 'koa-router';
import { z } from 'zod';
import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import { koaSwagger } from 'koa2-swagger-ui';

export class KoaRouteFactory extends RouteFactory<KoaRequestAdapter> {
  public readonly router = new Router();

  constructor(app: Koa) {
    super();

    app.use(this.router.routes()).use(this.router.allowedMethods());
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
    handler: IMiddleware<
      'json' extends keyof I['out'] ? { input: I['out'] } : any
    >,
  ) {
    if (route.method === 'trace') {
      throw new Error('trace method is not supported');
    }
    const _router = this._route(route);
    this.router[route.method](
      route.path,
      async (ctx, next) => {
        const context: Context<KoaRequestAdapter, I> = {
          req: new KoaRequestAdapter(ctx.request),
          input: {},
        };
        const c = await _router(context);
        ctx.state.input = c.input;
        next();
      },
      handler,
    );
  }

  doc<P extends string>(path: P, configure: OpenAPIObjectConfigV31) {
    this.router.get(path, (ctx) => {
      try {
        const document = this.getOpenAPIDocument(configure);
        ctx.body = document;
      } catch (error) {
        ctx.status = 500;
        ctx.body = { error: error };
      }
    });
  }
}

const app = new Koa();
app.use(bodyParser());
const factory = new KoaRouteFactory(app);

const route = factory.createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: 'OK',
    },
  },
});

factory.route(route, async (ctx) => {
  ctx.body = ctx.state.input.json;
});

factory.doc('/docs', {
  openapi: '3.1.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
});

app.use(
  koaSwagger({
    routePrefix: '/api-docs',
    swaggerOptions: {
      url: '/docs',
    },
  }),
);
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
