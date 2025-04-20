import { createRoute, FastifyRouteFactory } from '@node-openapi/fastify';
import Fastify from 'fastify';
import { z } from 'zod';
import { getAbsoluteFSPath } from 'swagger-ui-dist';
import fastifyStatic from '@fastify/static';

const app = Fastify();

// Register static file serving plugin
const swaggerUIPath = getAbsoluteFSPath();
app.register(fastifyStatic, {
  root: swaggerUIPath,
  prefix: '/api-docs/',
  decorateReply: false,
});

const factory = new FastifyRouteFactory(app);

const route = createRoute({
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

factory.route(route, async (_req, _reply, input) => {
  return {
    data: {
      message: input.json.message,
    },
    status: 200,
  };
});

factory.doc('/docs', {
  openapi: '3.1.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
});

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

app.listen({ port: 3000 }, () => {
  console.log('Server is running on port 3000');
  console.log('API documentation available at http://localhost:3000/api-docs');
});
