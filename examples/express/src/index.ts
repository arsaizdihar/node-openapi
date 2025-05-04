import 'dotenv/config';

import express, { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ExpressRouteFactory } from '@node-openapi/express';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import { userController } from './controller/user.controller';
import { profileController } from './controller/profile.controller';
import { HttpError } from 'ws-common/service/error.service';
import { articlesController } from './controller/articles.controller';
import { bearerSecurity } from './routes/security';

const app = express();
app.use(express.json());
app.use(cookieParser());

const mainFactory = new ExpressRouteFactory(app);

mainFactory.router('/api', articlesController);
mainFactory.router('/api', profileController);
mainFactory.router('/api', userController);

mainFactory.doc(
  '/docs',
  {
    openapi: '3.1.0',
    info: {
      title: 'API',
      version: '1.0.0',
    },
    tags: [
      {
        name: 'articles',
        description: 'Articles',
      },
      {
        name: 'profile',
        description: 'Profile',
      },
      {
        name: 'user',
        description: 'User and Authentication',
      },
    ],
  },
  [bearerSecurity],
);

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: '/docs',
    },
  }),
);

function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Invalid request',
      details: err.flatten().fieldErrors,
    });
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
    });
    next(err);
    return;
  }

  res.status(500).json({
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal Server Error',
  });
  next(err);
}

app.use(errorHandler);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
