import 'dotenv/config';

import bodyParser from '@koa/bodyparser';
import cors from '@koa/cors';
import { OpenAPIRouter } from '@node-openapi/koa';
import Koa from 'koa';
import { koaSwagger } from 'koa2-swagger-ui';
import { HttpError } from 'ws-common/service/error.service';
import { ZodError } from 'zod';
import { articlesRouter } from './controller/articles.controller';
import { commentsRouter } from './controller/comments.controller';
import { profileRouter } from './controller/profile.controller';
import { tagsRouter } from './controller/tags.controller';
import { userRouter } from './controller/user.controller';

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
const mainRouter = new OpenAPIRouter();

mainRouter.use('/api', articlesRouter);
mainRouter.use('/api', profileRouter);
mainRouter.use('/api', userRouter);
mainRouter.use('/api', commentsRouter);
mainRouter.use('/api', tagsRouter);

mainRouter.doc('/docs', {
  openapi: '3.1.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
});

mainRouter.registerApp(app);

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
