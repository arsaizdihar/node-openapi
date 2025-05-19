import { NextRouteFactory } from '@node-openapi/next';
import { tagsController } from './controller/tags.controller';
import { userController } from './controller/user.controller';
import { profileController } from './controller/profile.controller';
import { commentsController } from './controller/comments.controller';
import { articlesController } from './controller/articles.controller';
import { NextResponse } from 'next/server';

const mainFactory = new NextRouteFactory();

mainFactory.router('/api', articlesController);
mainFactory.router('/api', profileController);
mainFactory.router('/api', userController);
mainFactory.router('/api', commentsController);
mainFactory.router('/api', tagsController);

mainFactory.doc('/doc', {
  openapi: '3.1.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
});

mainFactory.afterResponse((req, ctx, res) => {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  );
  res.headers.set('Access-Control-Allow-Headers', '*');
});

mainFactory.options('/**', () => {
  return new NextResponse(null, { status: 204 });
});

export const { GET, POST, PUT, DELETE, PATCH, OPTIONS } = mainFactory.handlers;
