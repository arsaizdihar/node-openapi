# @node-openapi/hapi

<p align="center">
  <a href="https://www.npmjs.com/package/@node-openapi/hapi" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@node-openapi/hapi.svg">
  </a>
  <a href="https://img.shields.io/npm/l/@node-openapi/hapi" target="_blank">
    <img alt="License" src="https://img.shields.io/npm/l/@node-openapi/hapi.svg">
  </a>
</p>

> Hapi adapter for `@node-openapi/core` — define Zod-validated routes, generate OpenAPI 3.1 docs, and send type-safe responses in Hapi.

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
  - [`.registerServer(server)`](#registerserver)
  - [`OpenAPIRouter.createRoute(routeConfig)`](#openapiroutercreaterouterouteconfig) (or re-exported `createRoute`)
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
npm install @hapi/hapi @node-openapi/hapi

# yarn
yarn add @hapi/hapi @node-openapi/hapi

# pnpm
pnpm add @hapi/hapi @node-openapi/hapi
```

Ensure you have a compatible version of **Hapi** (v21+) and **Zod** (v3+).

---

## Quick Start

Create a minimal Hapi server with a **GET /ping** route and serve the OpenAPI JSON at **/docs**.

```ts
import Hapi from '@hapi/hapi';
import { OpenAPIRouter, createRoute, z } from '@node-openapi/hapi';

const init = async () => {
  const server = Hapi.server({ port: 3000 });

  // 1. Initialize the router
  const router = new OpenAPIRouter();

  // 2. Define a simple ping route
  const pingRoute = createRoute({
    method: 'get',
    path: '/ping', // Hapi uses {param} for path parameters, same as OpenAPI
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
    return h.json({ message: 'pong' });
  });

  // 3. Serve OpenAPI docs
  router.doc('/docs', {
    openapi: '3.1.0',
    info: { title: 'API', version: '1.0.0' },
  });

  // 4. Register the router with the Hapi server
  await router.registerServer(server);

  // 5. Start server
  await server.start();
  console.log('🚀 Server running at', server.info.uri);
  console.log('📖 API docs available at', server.info.uri + '/docs');
};

init();
```

---

## API Reference

### `new OpenAPIRouter(options?)`

- `options.name?: string` - (default: random string) The name for the Hapi plugin created by the router.
- `options.validateResponse?: boolean` — (default `true`) Enable or disable runtime response validation against your OpenAPI schemas in the `h` helper.

### `.middleware(handler)`

Register a Hapi [pre-handler](https://hapi.dev/api/?v=21.3.9#-routeoptionspre) for **all** routes defined on this router instance and its children.
The `handler` should be a Hapi `RouteOptionsPreAllOptions` object. You can use `request.app` (typed as `TContext`) to pass data between middlewares and to the route handler.

```ts
const router = new OpenAPIRouter<{ user?: { id: string } }>();

router.middleware({
  assign: 'user', // Makes context.user available in subsequent pre-handlers and the main handler
  method: async (request, h) => {
    const userId = request.headers['x-user-id'];
    if (typeof userId === 'string') {
      request.app.user = { id: userId }; // request.app is TContext
    }
    return h.continue; // or simply return the value for 'user'
  },
});
```

### `.route(routeConfig, handler)`

Define a handler for a route. The handler will run after all middlewares (pre-handlers) and request validation. The handler receives an object with:

- `req`: the native Hapi request (`Request<TRefs>`)
- `h`: the Hapi response toolkit (`ResponseToolkit<TRefs>`), augmented with `json` and `text` helpers.
- `input`: validated request data (param, query, header, cookie, json, form).
- `context`: the `request.app` object, typed as `TContext`.

```ts
router.route(myRouteConfig, async ({ input, context, h, req }) => {
  // ... your logic ...
  // The data type is inferred by the status code.
  return h.json({ data: result }); // Responds with status 200 by default
  // return h.json({ error: 'Not found' }, 404);
});
```

### `.use(path, subRouter)`

Mount a child `OpenAPIRouter` under a base path. Its routes will be registered as a nested Hapi plugin. Middlewares from the parent router are passed down. OpenAPI definitions are merged.

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

### `.registerServer(server)`

Registers this router (and its sub-routers) as a Hapi plugin with the provided `Server` instance.
This should be called after all routes and middlewares are defined.

```ts
const server = Hapi.server({ port: 3000 });
const router = new OpenAPIRouter();
// ... define routes, middlewares, use sub-routers ...
await router.registerServer(server);
```

### `OpenAPIRouter.createRoute(routeConfig)`

(also re-exported as `createRoute`)

Static helper to define `RouteConfig` objects. For Hapi, `routeConfig.path` should use Hapi's path parameter syntax (e.g., `/articles/{slug}`), which is compatible with OpenAPI.

```ts
const articleRoute = OpenAPIRouter.createRoute({
  method: 'get',
  path: '/articles/{slug}', // Hapi path uses {param}
  request: {
    params: z.object({ slug: z.string() }),
  },
  // ...responses
});
```

### `z`

Re-exported Zod instance from `@node-openapi/core` for defining schemas. It has additional types for OpenAPI documentation under `.openapi()`. See [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi?tab=readme-ov-file#the-openapi-method).

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

- **Response validation**: Disable via `new OpenAPIRouter({ validateResponse: false })`.
- **Path parameters**: Hapi uses `{paramName}` for path parameters, which is the same as OpenAPI. `createRoute`'s `path` field will be used directly.

---

## Examples

See a complete example with authentication and CRUD routes in the [`examples/hapi`](https://github.com/arsaizdihar/node-openapi/tree/main/examples/hapi) folder:

```
examples/hapi/
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
   └─ index.ts            # main Hapi server setup
```

---

## Advanced Usage

- **Context Extension**: Use `.extend()` on a router to create derived router instances with more specific `TContext` types (which corresponds to `request.app` in Hapi).
- **Error handling**: Zod validation errors or errors thrown in handlers will propagate. You can use Hapi's `server.ext('onPreResponse', ...)` to customize error responses globally. See the example `index.ts`.
- **Middleware (Pre-handler) Ordering**: Middlewares are Hapi pre-handlers. They are applied in the order defined by Hapi's pre-handler system. Refer to Hapi documentation for details on ordering and assignments.

---

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/arsaizdihar/node-openapi/blob/main/LICENSE) file for details.
