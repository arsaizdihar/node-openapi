import { ExpressRouteFactory } from '@node-openapi/express';
import express, { NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { z, ZodError } from 'zod';

const app = express();
app.use(express.json());

const factory = new ExpressRouteFactory(app);

const route = ExpressRouteFactory.createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({
              example: 'Hello, world!',
            }),
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

factory.route(route, async (_, res) => {
  res.status(200).json({
    message: res.locals.json.message,
  });
});

factory.doc('/docs', {
  openapi: '3.1.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: '/docs',
    },
  }),
);

const errorHandler = (
  err: Error,
  _: Request,
  res: Response,
  __: NextFunction,
) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: err,
    });
    return;
  }

  res.status(500).json({
    message: 'Internal Server Error',
  });
};

app.use(errorHandler);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
