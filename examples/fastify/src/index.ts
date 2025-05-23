import 'dotenv/config';

import fastifyStatic from '@fastify/static';
import { OpenAPIRouter } from '@node-openapi/fastify';
import Fastify from 'fastify';
import { getAbsoluteFSPath } from 'swagger-ui-dist';
import { articlesRouter } from './controller/articles.controller';
import { userRouter } from './controller/user.controller';
import { profileRouter } from './controller/profile.controller';
import { commentsRouter } from './controller/comments.controller';
import { tagsRouter } from './controller/tags.controller';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { HttpError } from 'ws-common/service/error.service';
const app = Fastify({ logger: true });

app.removeContentTypeParser('application/json');

app.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  function (_req, body, done) {
    if (!body || body.toString().trim() === '') {
      done(null, undefined);
      return;
    }
    try {
      const json = JSON.parse(body.toString());
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  },
);

const swaggerUIPath = getAbsoluteFSPath();
app.register(cors, { methods: ['GET', 'POST', 'PUT', 'DELETE'] });
app.register(fastifyStatic, {
  root: swaggerUIPath,
  prefix: '/api-docs/',
  decorateReply: false,
});

app.setErrorHandler((err, _req, reply) => {
  if (err instanceof ZodError) {
    return reply.status(400).send({
      status: 400,
      errors: {
        body: err.flatten().fieldErrors,
      },
    });
  }
  if (err instanceof HttpError) {
    return reply.status(err.statusCode).send({
      status: err.statusCode,
      errors: {
        body: [err.message],
      },
    });
  }
  return reply.status(500).send({
    status: 500,
    errors: {
      body: ['Internal Server Error'],
    },
  });
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
});

mainRouter.registerApp(app);

// Redirect /api-docs to /api-docs/
app.get('/api-docs', (_req, reply) => {
  reply.redirect('/api-docs/');
});

// Serve custom swagger-initializer.js
app.get('/api-docs/swagger-initializer.js', (_req, reply) => {
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
  reply.type('application/javascript').send(js);
});
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.listen({ port }, () => {
  console.log(`Server is running on port ${port}`);
  console.log(
    `API documentation available at http://localhost:${port}/api-docs`,
  );
});
