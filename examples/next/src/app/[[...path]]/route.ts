import { OpenAPIRouter } from '@node-openapi/next';
import { tagsRouter } from './controller/tags.controller';
import { userRouter } from './controller/user.controller';
import { profileRouter } from './controller/profile.controller';
import { commentsRouter } from './controller/comments.controller';
import { articlesRouter } from './controller/articles.controller';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { HttpError } from 'ws-common/service/error.service';

const mainRouter = new OpenAPIRouter();

mainRouter.use('/api', articlesRouter);
mainRouter.use('/api', profileRouter);
mainRouter.use('/api', userRouter);
mainRouter.use('/api', commentsRouter);
mainRouter.use('/api', tagsRouter);

mainRouter.doc('/doc', {
  openapi: '3.1.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
});

mainRouter.afterResponse((_, res) => {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  );
  res.headers.set('Access-Control-Allow-Headers', '*');
});

mainRouter.options('/**', () => {
  return new NextResponse(null, { status: 204 });
});

mainRouter.onError((_, err) => {
  console.error(err);
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        status: 400,
        errors: {
          body: err.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  if (err instanceof HttpError) {
    return NextResponse.json(
      {
        status: err.statusCode,
        errors: {
          body: [err.message],
        },
      },
      { status: err.statusCode },
    );
  }

  return NextResponse.json(
    {
      status: 500,
      errors: {
        body: ['Internal Server Error'],
      },
    },
    { status: 500 },
  );
});

export const { GET, POST, PUT, DELETE, PATCH, OPTIONS } = mainRouter.handlers;
