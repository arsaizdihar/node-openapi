# @node-openapi/express

<p align="center">
  <a href="https://www.npmjs.com/package/@node-openapi/express" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@node-openapi/express.svg">
  </a>
  <a href="https://img.shields.io/npm/l/@node-openapi/express" target="_blank">
    <img alt="License" src="https://img.shields.io/npm/l/@node-openapi/express.svg">
  </a>
</p>

> Express adapter for `@node-openapi/core` — define Zod-validated routes, generate OpenAPI 3.1 docs, and send type-safe responses in Express.

**Read more in the [core library docs](https://github.com/arsaizdihar/node-openapi/tree/main/packages/core).**

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [`new OpenAPIRouter(options?)`](#new-openapirouteroptions)
  - [`.middleware(fn)`](#middlewarefn)
  - [`.route(routeConfig, ...handlers)`](#routerouteconfig-handlers)
  - [`.use(path, subRouter)`](#usepath-subrouter)
  - [`.doc(path, openapiConfig, additionalDefinitions?)`](#docpath-openapiconfig-additionaldefinitions)
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
npm install express @node-openapi/express

# yarn
yarn add express @node-openapi/express

# pnpm
pnpm add express @node-openapi/express
```

Ensure you have a compatible version of **Express** (v5+) and **Zod** (v3+).

---

## Quick Start

Create a minimal Express server with a **GET /ping** route and serve the OpenAPI JSON at **/docs**.

```ts
import express from 'express';
import { OpenAPIRouter, createRoute, z } from '@node-openapi/express';

const app = express();
app.use(express.json());

// 1. Initialize the router. Pass the app instance to be the main router.
const router = new OpenAPIRouter({ router: app });

// 2. Define a simple ping route
const pingRoute = createRoute({
  method: 'get',
  path: '/ping',
  request: {},
  responses: {
    200: {
      content: {
        'application/json': { schema: z.object({ message: z.string() }) },
      },
    },
  },
});

router.route(pingRoute, async ({ h }, next) => {
  h.json({ data: { message: 'pong' } });
});

// 3. Serve OpenAPI docs
router.doc('/docs', {
  openapi: '3.1.0',
  info: { title: 'API', version: '1.0.0' },
});

// 4. Start server
app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
  console.log('📖 API docs available at http://localhost:3000/docs');
});
```

---

## API Reference

### `new OpenAPIRouter(options?)`

- `options.router?: Router` — Provide an existing Express `Router` instance to mount routes. Pass express app instance to the main router. If not provided, a new one will be created.
- `options.validateResponse?: boolean` — (default `true`) Enable or disable runtime response validation against your OpenAPI schemas.

### `.middleware(fn)`

Register global middleware for **all** routes defined on this router. The typing of the middleware can be passed when creating the router.

```ts
const router = new OpenAPIRouter<{ user: User }>();

router.middleware(async ({ req, context }, next) => {
  // attach data to context or handle auth
  context.user = await getUser(req.headers.authorization);
  next();
});
```

### `.route(routeConfig, ...handlers)`

Define one or more handlers for a route. It will run the handlers after the middleware and request validation. The handler will receive the argument with the following properties:

- `req`: the native Express request
- `res`: the native Express response
- `input`: validated request data (param, query, header, body, cookie)
- `context`: any values attached by your middleware
- `h`: a typed helper for sending `json` or `text`. The typing is based on the response schema in the route config. The function will also validates the data that is given if the `validateResponse` option is enabled.

```ts
router.route(myRouteConfig, async ({ input, context, h }, next) => {
  // ... your logic ...
  // the data type is inferred by the status, and the default status is 200.
  h.json({ data: result, status: 200 });
});
```

### `.use(path, subRouter)`

Mount a child `OpenAPIRouter` under a base path and merge its OpenAPI definitions.

```ts
router.use('/admin', adminRouter);
```

### `.doc(path, openapiConfig, additionalDefinitions?)`

Serve the merged OpenAPI document as JSON at `path`.

```ts
router.doc('/docs', {
  openapi: '3.1.0',
  info: { title: 'My Service', version: '1.2.3' },
});
```

### `createRoute`

Re-exported helper to define `RouteConfig` objects with integrated `getRoutingPath()`.

### `z`

Re-exported Zod instance for defining schemas. It has additional types for OpenAPI documentation under .openapi. You can read more of the options from [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi?tab=readme-ov-file#the-openapi-method).

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
- **Override router**: pass your own Express `Router` via `expressRouter` option, otherwise a new one will be created.

---

## Examples

See a complete example with authentication and CRUD routes in the [`examples/express`](https://github.com/arsaizdihar/node-openapi/tree/main/examples/express) folder:

```
examples/express/
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ factories.ts        # auth middleware factories
   ├─ controllers/
   │  └─ articles.controller.ts
   ├─ routes/
   │  └─ articles.routes.ts
   └─ index.ts            # main Express server setup
```

---

## Advanced Usage

- **Nesting**: use `.extend()` on a router to create sub-factories with different `context` types.
- **Error handling**: Zod or route errors bubble through `next(err)`, use Express error middleware.
- **Middleware ordering**: `.middleware()` applies globally before every route's validator and handlers.

---

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/arsaizdihar/node-openapi/blob/main/LICENSE) file for details.
