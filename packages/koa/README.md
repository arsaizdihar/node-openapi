# @node-openapi/koa

<p align="center">
  <a href="https://www.npmjs.com/package/@node-openapi/koa" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@node-openapi/koa.svg">
  </a>
  <a href="https://img.shields.io/npm/l/@node-openapi/koa" target="_blank">
    <img alt="License" src="https://img.shields.io/npm/l/@node-openapi/koa.svg">
  </a>
</p>

> Koa adapter for `@node-openapi/core` — define Zod-validated routes, generate OpenAPI 3.1 docs, and send type-safe responses in Koa using `koa-router`.

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
npm install koa koa-router @node-openapi/koa

# yarn
yarn add koa koa-router @node-openapi/koa

# pnpm
pnpm add koa koa-router @node-openapi/koa
```

Ensure you have compatible versions of **Koa** (v2+), **koa-router** (v10+), and **Zod** (v3+).

---

## Quick Start

Create a minimal Koa server with a **GET /ping** route and serve the OpenAPI JSON at **/docs**.

```ts
import Koa from 'koa';
import Router from 'koa-router'; // Optional: if you want to use koa-router directly
import { OpenAPIRouter, createRoute, z } from '@node-openapi/koa';

const app = new Koa();

// 1. Initialize the router. Optionally pass an existing koa-router instance.
const router = new OpenAPIRouter(); // Creates an internal koa-router
// OR: const koaRouter = new Router(); const router = new OpenAPIRouter({ router: koaRouter });

// 2. Define a simple ping route
const pingRoute = createRoute({
  method: 'get',
  path: '/ping', // OpenAPI path
  getRoutingPath: () => '/ping', // koa-router path (can use :param for params)
  request: {},
  responses: {
    200: {
      content: {
        'application/json': { schema: z.object({ message: z.string() }) },
      },
    },
  },
});

router.route(pingRoute, (ctx) => {
  ctx.h.json({ message: 'pong' }); // Defaults to status 200
});

// 3. Serve OpenAPI docs
router.doc('/docs', {
  openapi: '3.1.0',
  info: { title: 'My Koa API', version: '1.0.0' },
});

// 4. Register the OpenAPIRouter with the Koa app
router.registerApp(app);

// 5. Start server
app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
  console.log('📖 API docs available at http://localhost:3000/docs');
});
```

---

## API Reference

### `new OpenAPIRouter(options?)`

- `options.router?: Router` — Provide an existing `koa-router` instance. If not provided, a new one is created internally.
- `options.validateResponse?: boolean` — (default `true`) Enable or disable runtime response validation for `ctx.h.json()` and `ctx.h.text()` against your OpenAPI schemas.

### `.middleware(handler)`

Register a Koa `Middleware` for **all** routes defined on this router instance and its sub-routers (mounted via `.use()`). These middlewares run before the route-specific validation and handlers.

```ts
type MyState = { user?: { id: string } };
const router = new OpenAPIRouter<MyState>();

router.middleware(async (ctx, next) => {
  // ctx.state.user = await authenticateUser(ctx.get('Authorization'));
  await next();
});
```

### `.route(routeConfig, ...handlers)`

Define one or more Koa middleware handlers for a route. Middlewares registered on the router are applied first, then input validation, then your handlers.
The Koa context `ctx` is augmented with:

- `ctx.input`: The validated request data (param, query, header, cookie, json, form).
- `ctx.h`: A helper object with `json(data, status?)` and `text(data, status?)` methods for type-safe, schema-validated responses.

```ts
router.route(myRouteConfig, (ctx) => {
  const params = ctx.input.params;
  // const user = ctx.state.user; // From middleware
  // ... your logic ...
  ctx.h.json({ data: result }); // Status 200 by default
});
```

### `.use(path, subRouter)`

Mount another `OpenAPIRouter`'s `koa-router` under a base path and merge its OpenAPI definitions. Middlewares from the parent router are applied before the sub-router's own middlewares.

```ts
const adminApiRouter = new OpenAPIRouter();
// define routes on adminApiRouter...
mainRouter.use('/admin', adminApiRouter);
```

### `.doc(path, openapiConfig)`

Serve the merged OpenAPI document as JSON at `path` via a GET request.

```ts
router.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'My Service', version: '1.2.3' },
});
```

### `.registerApp(app)`

Registers the internal `koa-router` (with all its routes and sub-routers) with the main Koa `app` instance.
This effectively calls `app.use(this._router.routes())` and `app.use(this._router.allowedMethods())`.

### `createRoute`

Re-exported helper from `@node-openapi/core` to define `RouteConfig` objects. It requires a `getRoutingPath()` method that returns the `koa-router` specific path string (e.g., using `:param` for route parameters).

```ts
const articleRoute = createRoute({
  method: 'get',
  path: '/articles/{slug}', // OpenAPI path
  getRoutingPath: () => '/articles/:slug', // koa-router path
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
- **Path parameters**: `createRoute`'s `path` is for OpenAPI (e.g., `/users/{id}`), while `getRoutingPath()` is for `koa-router` (e.g., `/users/:id`).

---

## Examples

See a complete example with authentication and CRUD routes in the [`examples/koa`](https://github.com/arsaizdihar/node-openapi/tree/main/examples/koa) folder:

```
examples/koa/
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
   └─ index.ts            # main Koa server setup
```

---

## Advanced Usage

- **Custom State (`StateT`)**: Use `.extend<NewStateT>()` to create routers with more specific Koa state types. Middlewares can then populate `ctx.state` in a type-safe manner for subsequent handlers.
- **Error handling**: Zod validation errors are thrown and should be caught by a top-level Koa error handling middleware. Other errors thrown in handlers can also be managed this way. See the example `index.ts` for an error handling middleware.
- **Middleware Ordering**: Middlewares registered with `.middleware()` are applied by `koa-router` before the validation middleware and route-specific handlers. If using `.use()` to mount sub-routers, parent middlewares also run before sub-router middlewares.

---

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/arsaizdihar/node-openapi/blob/main/LICENSE) file for details.
