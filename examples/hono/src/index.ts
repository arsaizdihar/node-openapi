import 'dotenv/config';
import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import { HttpError } from 'ws-common/service/error.service';
import { HonoRouteFactory, z } from '@node-openapi/hono';

import { userController } from './controller/user.controller';
import { profileController } from './controller/profile.controller';
import { articlesController } from './controller/articles.controller';
import { bearerSecurity } from './routes/security';
import { commentsController } from './controller/comments.controller';
import { tagsController } from './controller/tags.controller';
import { logger } from 'hono/logger';
const app = new Hono();
app.use(logger());

app.use('*', cors());
app.use('*', prettyJSON());

const mainFactory = new HonoRouteFactory({ app });

mainFactory.router('/api', userController);
mainFactory.router('/api', profileController);
mainFactory.router('/api', articlesController);
mainFactory.router('/api', commentsController);
mainFactory.router('/api', tagsController);

const openAPIDocPath = '/openapi.json';
mainFactory.doc(
  openAPIDocPath,
  {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Hono RealWorld API',
      description: 'RealWorld API implementation using Hono and @node-openapi',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local server' }],
  },
  [bearerSecurity],
);

app.get('/doc', swaggerUI({ url: openAPIDocPath }));

app.onError((err, c) => {
  if (err instanceof z.ZodError) {
    return c.json(
      {
        status: 400,
        errors: {
          body: err.flatten().fieldErrors,
        },
      },
      400,
    );
  }
  if (err instanceof HttpError) {
    return c.json(
      {
        status: err.statusCode,
        errors: { body: [err.message] },
      },
      err.statusCode as any,
    );
  }
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return c.json(
    {
      status: 500,
      errors: { body: ['Internal Server Error'] },
    },
    500,
  );
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
console.log(`Server is running on port ${port}`);
console.log(
  `OpenAPI JSON available at http://localhost:${port}${openAPIDocPath}`,
);
console.log(`Swagger UI available at http://localhost:${port}/doc`);

serve({
  fetch: app.fetch,
  port: port,
});

export default app;
