import { createRoute, HapiRouteFactory } from '@node-openapi/hapi';
import { Server, Request, ResponseToolkit } from '@hapi/hapi';
import { z } from 'zod';
import Inert from '@hapi/inert';
import { getAbsoluteFSPath } from 'swagger-ui-dist';

const server = new Server({
  port: 3000,
  host: 'localhost',
});

const factory = new HapiRouteFactory(server);

// Add middleware
factory.middleware(async (request: Request, h: ResponseToolkit) => {
  (request as any).user = {
    id: '1',
    name: 'John Doe',
  };
  return h.continue;
});

// Define a route
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

// Register the route
factory.route(route, async (request: Request, h: ResponseToolkit) => {
  return h.response({
    message: (request as any).input.json.message,
  });
});

// Serve OpenAPI documentation
factory.doc('/docs', {
  openapi: '3.1.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
});

// Register Swagger UI
const init = async () => {
  await server.register([Inert]);

  // Serve Swagger UI static files
  const swaggerUIPath = getAbsoluteFSPath();

  console.log({ swaggerUIPath });

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

  // Serve custom swagger-initializer.js
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
