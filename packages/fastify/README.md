# @node-openapi/fastify

<p align="center">
  <a href="https://www.npmjs.com/package/@node-openapi/fastify" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@node-openapi/fastify.svg">
  </a>
  <a href="https://img.shields.io/npm/l/@node-openapi/fastify" target="_blank">
    <img alt="License" src="https://img.shields.io/npm/l/@node-openapi/fastify.svg">
  </a>
</p>

> Fastify adapter for `@node-openapi/core` — define Zod-validated routes, generate OpenAPI 3.1 docs, and send type-safe responses in Fastify.

**Read more in the [core library docs](https://github.com/arsaizdihar/node-openapi/tree/main/packages/core).**

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [`new OpenAPIRouter(options?)`](#new-openapirouteroptions)
  - [`.middleware(handler)`](#middlewarehandler)
  - [`.route(routeConfig, handler)`](#routerouteconfig-handler)
  - [`.use(path, subRouter)`](#usepath-subrouter)
  - [`.doc(path, openapiConfig)`](#docpath-openapiconfig)
  - [`.registerApp(app)`](#registerappapp)
  - [`createRoute`](#createroute)
  - [`z`](#z)
- [Configuration](#configuration)
- [Examples](#examples)
- [Advanced Usage](#advanced-usage)
- [License](#license)

---

## Installation

Install the adapter along with its peer dependencies:

```bash
# npm
npm install fastify @node-openapi/fastify

# yarn
yarn add fastify @node-openapi/fastify

# pnpm
pnpm add fastify @node-openapi/fastify
```

Ensure you have a compatible version of **Fastify** (v4+) and **Zod** (v3+).

---

## Quick Start

Create a minimal Fastify server with a **GET /ping** route and serve the OpenAPI JSON at **/docs**.

```ts
import Fastify from 'fastify';
import { OpenAPIRouter, createRoute, z } from '@node-openapi/fastify';

const app = Fastify();

// 1. Initialize the router
const router = new OpenAPIRouter();

// 2. Define a simple ping route
const pingRoute = createRoute({
  method: 'get',
  path: '/ping', // OpenAPI path
  getRoutingPath: () => '/ping', // Fastify path
  request: {},
  responses: {
    200: {
      content: {
        'application/json': { schema: z.object({ message: z.string() }) },
      },
    },
  },
});

router.route(pingRoute, async ({ h }) => {
  h.json({ message: 'pong' });
});

// 3. Serve OpenAPI docs
router.doc('/docs', {
  openapi: '3.1.0',
  info: { title: 'API', version: '1.0.0' },
});

// 4. Register the router with the Fastify app
router.registerApp(app);

// 5. Start server
app.listen({ port: 3000 }, () => {
  console.log('🚀 Server running at http://localhost:3000');
  console.log('📖 API docs available at http://localhost:3000/docs');
});
```

---

## API Reference

### `new OpenAPIRouter(options?)`

- `options.validateResponse?: boolean` — (default `true`) Enable or disable runtime response validation against your OpenAPI schemas in the `h` helper.

### `.middleware(handler)`

Register global middleware for **all** routes defined on this router instance and its children.
The `handler` function receives `request`, `reply`, and an object containing `context`.
The `context` object is shared across middlewares and the final route handler for a given request.

```ts
const router = new OpenAPIRouter<{ user?: { id: string } }>();

router.middleware(async (request, reply, { context }) => {
  const userId = request.headers['x-user-id'];
  if (typeof userId === 'string') {
    context.user = { id: userId };
  }
});
```

### `.route(routeConfig, handler)`

Define a handler for a route. The handler will run after all middlewares and request validation. The handler will receive an object with the following properties:

- `request`: the native Fastify request
- `reply`: the native Fastify reply
- `input`: validated request data (param, query, header, cookie, form, json)
- `context`: any values attached by your middleware
- `h`: a typed helper for sending `json` or `text` responses. The typing is based on the response schema in the route config. The helper will also validate the response data if the `validateResponse` option is enabled.

```ts
router.route(myRouteConfig, async ({ input, context, h }) => {
  // ... your logic ...
  // The data type is inferred by the status, and the default status is 200.
  h.json({ data: result }); // Responds with status 200 by default
  // h.json({ error: 'Not found' }, 404);
});
```

### `.use(path, subRouter)`

Mount a child `OpenAPIRouter` under a base path and merge its OpenAPI definitions. Middlewares from the parent router will be applied to the sub-router's routes.

```ts
const adminRouter = new OpenAPIRouter();
// Define routes on adminRouter...
router.use('/admin', adminRouter);
```

### `.doc(path, openapiConfig)`

Serve the merged OpenAPI document as JSON at `path`.

```ts
router.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'My Service', version: '1.2.3' },
});
```

### `.registerApp(app)`

Registers all defined routes and middlewares with the provided Fastify application instance. This method should be called after all routes, middlewares, and sub-routers have been defined.

```ts
const app = Fastify();
const router = new OpenAPIRouter();
// ... define routes, middlewares, use sub-routers ...
router.registerApp(app);
```

### `createRoute`

Re-exported helper from `@node-openapi/core` to define `RouteConfig` objects.
It requires a `getRoutingPath()` method that returns the Fastify-specific path string (e.g., using `:param` for route parameters).

```ts
const articleRoute = createRoute({
  method: 'get',
  path: '/articles/{slug}', // OpenAPI path
  getRoutingPath: () => '/articles/:slug', // Fastify path
  request: {
    params: z.object({ slug: z.string() }),
  },
  // ...responses
});
```

### `z`

Re-exported Zod instance from `@node-openapi/core` for defining schemas. It has additional types for OpenAPI documentation under `.openapi()`. You can read more about the options from [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi?tab=readme-ov-file#the-openapi-method).

```ts
const userSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .openapi('User');
```

---

## Configuration

- **Response validation**: disable by `new OpenAPIRouter({ validateResponse: false })`.
- **Path parameters**: Remember that `createRoute`'s `path` is for OpenAPI (e.g., `/users/{id}`), while `getRoutingPath()` is for Fastify (e.g., `/users/:id`).

---

## Examples

See a complete example with authentication and CRUD routes in the [`examples/fastify`](https://github.com/arsaizdihar/node-openapi/tree/main/examples/fastify) folder:

```
examples/fastify/
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ factories.ts        # auth middleware factories
   ├─ controller/
   │  ├─ articles.controller.ts
   │  ├─ user.controller.ts
   │  └─ ... (other controllers)
   ├─ routes/
   │  └─ articles.routes.ts
   └─ index.ts            # main Fastify server setup
```

---

## Advanced Usage

- **Context Extension**: Use `.extend()` on a router to create derived router instances with extended `TContext` types. This is useful for gradually adding typed properties to the context through middlewares.
- **Error handling**: Zod validation errors or errors thrown in handlers are caught by Fastify's `setErrorHandler`. You can customize this to format error responses. See the example `index.ts`.
- **Middleware Ordering**: Middlewares registered with `.middleware()` are applied in the order they are defined. They run before the route's input validation and the main handler.

---

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/arsaizdihar/node-openapi/blob/main/LICENSE) file for details.
