# @node-openapi/next

<p align="center">
  <a href="https://www.npmjs.com/package/@node-openapi/next" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@node-openapi/next.svg">
  </a>
  <a href="https://img.shields.io/npm/l/@node-openapi/next" target="_blank">
    <img alt="License" src="https://img.shields.io/npm/l/@node-openapi/next.svg">
  </a>
</p>

> Next.js App Router adapter for `@node-openapi/core` — define Zod-validated routes, generate OpenAPI 3.1 docs, and send type-safe responses within Next.js Route Handlers.

**Read more in the [core library docs](https://github.com/arsaizdihar/node-openapi/tree/main/packages/core).**

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [`new OpenAPIRouter(options?)`](#new-openapirouteroptions)
  - [`.middleware(handler)`](#middlewarehandler)
  - [`.route(routeConfig, handler)`](#routerouteconfig-handler)
  - [`.use(pathPrefix, subRouter)`](#usepathprefix-subrouter)
  - [`.doc(path, openapiConfig)`](#docpath-openapiconfig)
  - [`.get(path, handler)`, `.post(...)`, etc.](#getpath-handler-post-etc)
  - [`.afterResponse(handler)`](#afterresponsehandler)
  - [`.onError(handler)`](#onerrorhandler)
  - [`handlers` (property)](#handlers-property)
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
npm install next @node-openapi/next

# yarn
yarn add next @node-openapi/next

# pnpm
pnpm add next @node-openapi/next
```

Ensure you have compatible versions of **Next.js** (v13.2+ for App Router) and **Zod** (v3+).

---

## Quick Start

Create Route Handlers in your Next.js App Router (e.g., `app/api/[[...slug]]/route.ts`):

```ts
// app/api/[[...slug]]/route.ts
import { OpenAPIRouter, createRoute, z } from '@node-openapi/next';
import { NextResponse } from 'next/server';

// 1. Initialize the router. Define a custom context type if needed.
const router = new OpenAPIRouter<{ appName: string }>();

// Optional: Add a middleware to populate the context
router.middleware(async (args) => {
  args.context.appName = 'My Awesome App';
});

// 2. Define a simple ping route
const pingRoute = createRoute({
  method: 'get',
  path: '/ping', // OpenAPI path (relative to the router's base)
  getRoutingPath: () => '/ping', // Path segment for Next.js router
  request: {},
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), app: z.string() }),
        },
      },
    },
  },
});

router.route(pingRoute, async ({ h, context }) => {
  return h.json({ message: 'pong', app: context.appName });
});

// 3. Serve OpenAPI docs (e.g., at /api/openapi.json)
router.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'My Next.js API', version: '1.0.0' },
});

// 4. Export handlers for Next.js
export const { GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD } = router.handlers;
```

Your API would then be available, for example:

- `GET /api/ping`
- `GET /api/openapi.json`

---

## API Reference

### `new OpenAPIRouter(options?)`

- `options.validateResponse?: boolean` — (default `true`) Enable or disable runtime response validation for `args.h.json()` and `args.h.text()` against your OpenAPI schemas.

### `.middleware(handler)`

Register a middleware function. Middlewares run in order before route handlers. They receive `HandlerArgs<TContext>` and can modify `args.context` or return a `NextResponse` to end the request early.

```ts
router.middleware(async (args) => {
  // args.context.user = await authenticate(args.req.headers.get('authorization'));
});
```

### `.route(routeConfig, handler)`

Define a route with OpenAPI validation and documentation. The handler receives `HandlerArgs` containing `req`, `params`, `context`, validated `input`, and response helpers `h`.

```ts
router.route(myApiRouteConfig, async ({ input, context, h }) => {
  // const data = await serviceCall(input.body, context.user);
  return h.json({ data });
});
```

### `.use(pathPrefix, subRouter)`

Mount another `OpenAPIRouter` instance under a given `pathPrefix`. Routes and OpenAPI definitions from the `subRouter` will be merged, prefixed by `pathPrefix`.

```ts
const adminRouter = new OpenAPIRouter();
// define routes on adminRouter...
mainRouter.use('/admin', adminRouter); // adminRouter routes now under /admin/...
```

### `.doc(path, openapiConfig)`

Serve the merged OpenAPI document as JSON at the specified `path` (relative to the router's base path).

```ts
router.doc('/spec.json', {
  /* ... OpenAPI config ... */
});
```

### `.get(path, handler)`, `.post(...)`, etc.

Methods like `.get()`, `.post()`, etc., add simple routes without OpenAPI validation or documentation. Useful for internal or non-spec routes. They receive `HandlerArgs<TContext>`.

### `.afterResponse(handler)`

Register a hook called after a successful response is generated but before it's returned. Receives `HandlerArgs<TContext>` and the `NextResponse`.

### `.onError(handler)`

Register a hook for error handling. Receives `HandlerArgs<TContext>` and the `error`. Can return a `NextResponse` to override default error handling.

### `handlers` (property)

A getter that returns an object mapping HTTP methods (GET, POST, etc.) to Next.js Route Handler functions. Export this from your `route.ts` file.

```ts
// app/api/[[...slug]]/route.ts
export const { GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD } = router.handlers;
```

### `createRoute`

Re-exported helper from `@node-openapi/core`. `routeConfig.path` is the OpenAPI path relative to the router. `getRoutingPath()` should return the path segment for Next.js (e.g., `/items/:id` becomes `/items/[id]` if not using catch-all routes, or just the segment like `/items` or `/items/[id]` if using catch-all).

```ts
const itemRoute = createRoute({
  method: 'get',
  path: '/items/{itemId}', // OpenAPI path
  getRoutingPath: () => '/items/[itemId]', // Path for Next.js dynamic segment
  // For catch-all: getRoutingPath: () => '/items/[itemId]' is also fine.
  // Or if using a single router for /api, getRoutingPath can be just '/items/[itemId]'
  request: { params: z.object({ itemId: z.string() }) },
  // ...responses
});
```

### `z`

Re-exported Zod instance. Use `z.openapi()` for schema-level OpenAPI details. See [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi?tab=readme-ov-file#the-openapi-method).

---

## Configuration

- **Response validation**: Disable via `new OpenAPIRouter({ validateResponse: false })`.
- **Path parameters & `getRoutingPath()`**: `routeConfig.path` is for OpenAPI spec (e.g., `/users/{id}`). `getRoutingPath()` must return the path structure Next.js App Router expects for the file segment it's in (e.g., `/[id]` if in `app/users/[id]/route.ts` or `users/[id]` if in `app/api/[[...slug]]/route.ts` and this route is for `/api/users/:id`).

---

## Examples

See a complete example with authentication and CRUD routes in the [`examples/next`](https://github.com/arsaizdihar/node-openapi/tree/main/examples/next) folder:

```
examples/next/
├─ package.json
├─ tsconfig.json
└─ src/
   └─ app/
      ├─ [[...path]]/            # Catch-all API route directory
      │  ├─ controller/          # Controllers (sub-routers)
      │  │  ├─ articles.controller.ts
      │  │  └─ ...
      │  ├─ factories.ts         # Auth middleware, context factories
      │  ├─ routes/              # OpenAPI route definitions
      │  │  └─ articles.routes.ts
      │  └─ route.ts             # Main router setup & Next.js handlers export
      └─ layout.tsx
      └─ page.tsx
```

---

## Advanced Usage

- **Custom Context (`TContext`)**: Use `new OpenAPIRouter<MyContextType>()` and `router.extend<ExtendedContext>()` to pass typed context through middlewares (modified via `args.context`) to your route handlers.
- **Error Handling**: Use `.onError()` hooks to implement custom error responses. Zod validation errors are automatically handled by an internal error hook if not caught by a custom one, returning a 400 JSON response.
- **CORS, Options handlers**: Implement global OPTIONS handlers or use `afterResponse` to set CORS headers.

---

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/arsaizdihar/node-openapi/blob/main/LICENSE) file for details.
