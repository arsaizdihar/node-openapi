import 'dotenv/config';

import bodyParser from '@koa/bodyparser';
import cors from '@koa/cors';
import { KoaRouteFactory } from '@node-openapi/koa';
import Koa from 'koa';
import { koaSwagger } from 'koa2-swagger-ui';
import { HttpError } from 'ws-common/service/error.service';
import { ZodError } from 'zod';
import { articlesController } from './controller/articles.controller';
import { commentsController } from './controller/comments.controller';
import { profileController } from './controller/profile.controller';
import { tagsController } from './controller/tags.controller';
import { userController } from './controller/user.controller';

const app = new Koa();

app.use(cors());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.log(err);
    if (err instanceof ZodError) {
      ctx.status = 400;
      ctx.body = {
        status: 400,
        errors: {
          body: err.flatten().fieldErrors,
        },
      };
      return;
    }

    if (err instanceof HttpError) {
      ctx.status = err.statusCode;
      ctx.body = {
        status: err.statusCode,
        errors: {
          body: [err.message],
        },
      };
      return;
    }

    ctx.status = 500;
    ctx.body = {
      status: 500,
      errors: {
        body: ['Internal Server Error'],
      },
    };

    ctx.app.emit('error', err, ctx);
  }
});

app.use(bodyParser());
const mainFactory = new KoaRouteFactory();

mainFactory.router('/api', articlesController);
mainFactory.router('/api', profileController);
mainFactory.router('/api', userController);
mainFactory.router('/api', commentsController);
mainFactory.router('/api', tagsController);

mainFactory.doc('/docs', {
  openapi: '3.1.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
});

mainFactory.registerApp(app);

app.use(
  koaSwagger({
    routePrefix: '/api-docs',
    swaggerOptions: {
      url: '/docs',
    },
  }),
);
app.listen(process.env.PORT ?? 3000, () => {
  console.log('Server is running on port 3000');
});
