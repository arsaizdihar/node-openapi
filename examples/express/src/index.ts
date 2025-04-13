import 'dotenv/config';
import { container } from 'ws-common/container';

import express, { NextFunction, Request, Response } from 'express';
import { ErrorSchema } from 'ws-common/domain/errors.domain';
import { HttpError } from 'ws-common/errors/http.errors';
import {
  baseConfigSchema,
  ConfigService,
} from 'ws-common/service/config.service';
import { ZodError } from 'zod';
import { UserController } from './controller/user.controller';
import { ExpressRouteFactory } from '@node-openapi/express';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());

const config = new ConfigService(baseConfigSchema.parse(process.env));

container.bind(ConfigService).toConstantValue(config);

const userController = container.get(UserController);

const mainFactory = new ExpressRouteFactory(app);

mainFactory.router('/user', userController.factory);

mainFactory.doc('/docs', {
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

function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ErrorSchema>,
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
      code: err.code as ErrorSchema['code'],
      message: err.message,
      details: err.details,
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
