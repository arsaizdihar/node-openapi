import { KoaRouteFactory } from '@node-openapi/koa';
import Koa from 'koa';
import bodyParser from '@koa/bodyparser';
import { koaSwagger } from 'koa2-swagger-ui';
import { z } from 'zod';

const app = new Koa();
app.use(bodyParser());
const factory = new KoaRouteFactory();
factory.registerApp(app);

const route = KoaRouteFactory.createRoute({
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
