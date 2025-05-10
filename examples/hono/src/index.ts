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
import { articlesController } from './controller/article.controller';
import { bearerSecurity } from './routes/security';

const app = new Hono();

app.use('*', cors());
app.use('*', prettyJSON());

const mainFactory = new HonoRouteFactory(app);
const apiFactory = new HonoRouteFactory();

apiFactory.router('', userController);
apiFactory.router('', profileController);
apiFactory.router('', articlesController);

mainFactory.router('/api', apiFactory);

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
  console.error(
    `[Hono Error Handler] Path: ${c.req.path}, Method: ${c.req.method}`,
    err,
  );
  if (err instanceof HttpError) {
    return c.json({ errors: { body: [err.message] } }, err.statusCode as any);
  }
  if (err instanceof z.ZodError) {
    return c.json(
      {
        errors: {
          body: err.issues.map(
            (e: { path: (string | number)[]; message: string }) =>
              `${e.path.join('.')}: ${e.message}`,
          ),
        },
      },
      422,
    );
  }
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return c.json({ errors: { body: ['Internal Server Error'] } }, 500);
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
