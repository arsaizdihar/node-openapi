import 'dotenv/config';

import { Server } from '@hapi/hapi';
import Inert from '@hapi/inert';
import { OpenAPIRouter } from '@node-openapi/hapi';
import { getAbsoluteFSPath } from 'swagger-ui-dist';
import { HttpError } from 'ws-common/service/error.service';
import { ZodError } from 'zod';
import { commentsRouter } from './controller/comments.controller';
import { profileRouter } from './controller/profile.controller';
import { tagsRouter } from './controller/tags.controller';
import { userRouter } from './controller/user.controller';
import { articlesRouter } from './controller/articles.controller';

const server = new Server({
  port: process.env.PORT ?? 3000,
  host: 'localhost',
  routes: {
    cors: {
      origin: ['*'],
    },
  },
});

server.ext('onPreResponse', (request, h) => {
  const response = request.response;
  if (!(response instanceof Error)) {
    return h.continue;
  }

  const err = response;
  if (err instanceof ZodError) {
    response.output.statusCode = 400;
    response.output.payload = {
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: 'Invalid request',
      errors: {
        body: err.flatten().fieldErrors,
      },
      error: 'ValidationError',
    };
    return h.continue;
  }

  if (err instanceof HttpError) {
    response.output.statusCode = err.statusCode;
    response.output.payload = {
      statusCode: err.statusCode,
      message: err.message,
      error: err.name,
      errors: {
        body: [err.message],
      },
    };
    console.log(err);

    return h.continue;
  }

  return h.continue;
});

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
});

const init = async () => {
  await server.register([Inert]);

  const swaggerUIPath = getAbsoluteFSPath();

  await mainRouter.registerServer(server);

  server.route({
    method: 'GET',
    path: '/api-docs',
    handler: (_, h) => {
      return h.redirect('/api-docs/');
    },
  });

  server.route({
    method: 'GET',
    path: '/api-docs/{param*}',
    handler: {
      directory: {
        path: swaggerUIPath,
        redirectToSlash: true,
        index: true,
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/api-docs/swagger-initializer.js',
    handler: (_, h) => {
      const js = `window.onload = function() {
        window.ui = SwaggerUIBundle({
          url: '/docs',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.SwaggerUIStandalonePreset
          ],
        });
      }`;
      return h.response(js).type('application/javascript');
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

init().catch((err) => {
  console.error(err);
  process.exit(1);
});
