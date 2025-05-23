import 'dotenv/config';

import { OpenAPIRouter } from '@node-openapi/express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { HttpError } from 'ws-common/service/error.service';
import { ZodError } from 'zod';
import { articlesRouter } from './controller/articles.controller';
import { commentsRouter } from './controller/comments.controller';
import { profileRouter } from './controller/profile.controller';
import { tagsRouter } from './controller/tags.controller';
import { userRouter } from './controller/user.controller';
import { bearerSecurity } from './routes/security';

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const mainRouter = new OpenAPIRouter({ expressRouter: app });

mainRouter.use('/api', articlesRouter);
mainRouter.use('/api', profileRouter);
mainRouter.use('/api', userRouter);
mainRouter.use('/api', commentsRouter);
mainRouter.use('/api', tagsRouter);

mainRouter.doc(
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
        name: 'comments',
        description: 'Comments',
      },
      {
        name: 'favorites',
        description: 'Favorites',
      },
      {
        name: 'tags',
        description: 'Tags',
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
      errors: {
        body: err.flatten().fieldErrors,
      },
    });
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      errors: {
        body: [err.message],
      },
    });
    next(err);
    return;
  }

  res.status(500).json({
    status: 500,
    errors: {
      body: ['Internal Server Error'],
    },
  });
  next(err);
}

app.use(errorHandler);

app.listen(process.env.PORT ?? 3000, () => {
  console.log('Server is running on port 3000');
});
