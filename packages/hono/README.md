# @node-openapi/hono

<p align="center">
  <a href="https://www.npmjs.com/package/@node-openapi/hono" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@node-openapi/hono.svg">
  </a>
  <a href="https://img.shields.io/npm/l/@node-openapi/hono" target="_blank">
    <img alt="License" src="https://img.shields.io/npm/l/@node-openapi/hono.svg">
  </a>
</p>

> Hono adapter for `@node-openapi/core` — define Zod-validated routes, generate OpenAPI 3.1 docs, and send type-safe responses in Hono.

**Read more in the [core library docs](https://github.com/arsaizdihar/node-openapi/tree/main/packages/core).**

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [`new OpenAPIRouter(options?)`](#new-openapirouteroptions)
  - [`.middleware(handler)`](#middlewarehandler)
  - [`.route(routeConfig, ...handlers)`](#routerouteconfig-handlers)
  - [`.use(path, subRouter)`](#usepath-subrouter)
  - [`.doc(path, openapiConfig, additionalDefinitions?)`](#docpath-openapiconfig-additionaldefinitions)
  - [`app` (property)](#app-property)
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
npm install hono @node-openapi/hono

# yarn
yarn add hono @node-openapi/hono

# pnpm
pnpm add hono @node-openapi/hono
```

Ensure you have a compatible version of **Hono** (v3+) and **Zod** (v3+).

---

## Quick Start

Create a minimal Hono server with a **GET /ping** route and serve the OpenAPI JSON at **/openapi.json**.

```ts
import { Hono } from 'hono';
import { OpenAPIRouter, createRoute, z } from '@node-openapi/hono';

const app = new Hono();

// 1. Initialize the router. Optionally pass the main Hono app.
const router = new OpenAPIRouter({ app }); // Or new OpenAPIRouter(); then app.route('/', router.app);

// 2. Define a simple ping route
const pingRoute = createRoute({
  method: 'get',
  path: '/ping', // OpenAPI path
  getRoutingPath: () => '/ping', // Hono path (can use :param for params)
  request: {},
  responses: {
    200: {
      content: {
        'application/json': { schema: z.object({ message: z.string() }) },
      },
    },
  },
});

router.route(pingRoute, (c) => {
  return c.typedJson({ message: 'pong' }, 200);
});

// 3. Serve OpenAPI docs
router.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'My Hono API', version: '1.0.0' },
});

// If router was initialized without `app`:
// app.route('/', router.app);

// 4. Export or serve the app (e.g., for Cloudflare Workers, Deno, Node.js with @hono/node-server)
export default app;

// Example for Node.js server:
// import { serve } from '@hono/node-server';
// serve({ fetch: app.fetch, port: 3000 }, () => {
//   console.log('🚀 Server running at http://localhost:3000');
//   console.log('📖 API docs available at http://localhost:3000/openapi.json');
// });
```

---

## API Reference

### `new OpenAPIRouter(options?)`

- `options.app?: Hono<E>` — Provide an existing Hono app instance. If not provided, a new `Hono<E>()` is created and can be accessed via `router.app`.
- `options.validateResponse?: boolean` — (default `true`) Enable or disable runtime response validation for `c.typedJson()` and `c.typedText()` against your OpenAPI schemas.

### `.middleware(handler)`

Register a Hono `MiddlewareHandler` for **all** routes defined on this router instance after this call.

```ts
type MyEnv = { Variables: { user?: { id: string } } };
const router = new OpenAPIRouter<MyEnv>();

router.middleware(async (c, next) => {
  // c.set('user', await authenticateUser(c.req.header('Authorization')));
  await next();
});
```

### `.route(routeConfig, ...handlers)`

Define one or more Hono handlers for a route. Middlewares registered on the router are applied first, then input validation, then your handlers.
The Hono context `c` is augmented with `c.typedJson()` and `c.typedText()` for type-safe, schema-validated responses.
Validated input is available via `c.req.valid('param' | 'query' | 'json' | ...)`.

```ts
router.route(myRouteConfig, (c) => {
  const params = c.req.valid('param');
  // const user = c.var.user; // From middleware
  // ... your logic ...
  return c.typedJson({ data: result }, 200);
});
```

### `.use(path, subRouter)`

Mount another `OpenAPIRouter`'s Hono app under a base path and merge its OpenAPI definitions.

```ts
const adminApiRouter = new OpenAPIRouter();
// define routes on adminApiRouter.app ...
mainRouter.use('/admin', adminApiRouter);
```

### `.doc(path, openapiConfig, additionalDefinitions?)`

Serve the merged OpenAPI document as JSON at `path`.

- `additionalDefinitions?: OpenAPIDefinitions[]` - Optional array of Zod schemas to be included as reusable components in the OpenAPI document.

```ts
router.doc('/docs/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'My Service', version: '1.2.3' },
});
```

### `app` (property)

The Hono application instance (`Hono<E>`) associated with this router. You can use this to register non-OpenAPI routes, or mount this router's app into another Hono app using `parentApp.route('/prefix', router.app)`.

### `createRoute`

Re-exported helper from `@node-openapi/core` to define `RouteConfig` objects. It requires a `getRoutingPath()` method that returns the Hono-specific path string (e.g., using `:param` for route parameters).

```ts
const articleRoute = createRoute({
  method: 'get',
  path: '/articles/{slug}', // OpenAPI path
  getRoutingPath: () => '/articles/:slug', // Hono path
  request: {
    params: z.object({ slug: z.string() }),
  },
  // ...responses
});
```

### `z`

Re-exported Zod instance from `@node-openapi/core`. Use `z.openapi()` for schema-level OpenAPI extensions. See [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi?tab=readme-ov-file#the-openapi-method).

```ts
const userSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .openapi('User'); // Makes 'User' available as a reusable schema component
```

---

## Configuration

- **Response validation**: Disable by `new OpenAPIRouter({ validateResponse: false })`.
- **Path parameters**: `createRoute`'s `path` is for OpenAPI (e.g., `/users/{id}`), while `getRoutingPath()` is for Hono (e.g., `/users/:id`).

---

## Examples

See a complete example with authentication and CRUD routes in the [`examples/hono`](https://github.com/arsaizdihar/node-openapi/tree/main/examples/hono) folder:

```
examples/hono/
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ factories.ts        # auth middleware factories
   ├─ controller/
   │  ├─ articles.controller.ts
   │  ├─ user.controller.ts
   │  └─ ... (other controllers)
   ├─ routes/
   │  ├─ articles.routes.ts
   │  └─ security.ts       # Bearer security definition
   └─ index.ts            # main Hono server setup
```

---

## Advanced Usage

- **Context Extension (`c.var`)**: Use `.extend<NewEnv>()` to create routers with more specific Hono Environment types. Middlewares can then use `c.set('key', value)` to populate `c.var.key` in a type-safe manner for subsequent handlers.
- **Error handling**: Zod validation errors are automatically caught by an internal middleware and result in a 400 JSON response. Other errors thrown in handlers can be managed using Hono's standard `app.onError((err, c) => ...)` mechanism. See the example `index.ts`.
- **Middleware Ordering**: `.middleware()` calls apply to routes defined _after_ the middleware call on that specific router instance.

---

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/arsaizdihar/node-openapi/blob/main/LICENSE) file for details.
