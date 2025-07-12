# Node OpenAPI

<p align="center">
  <a href="https://www.npmjs.com/package/@node-openapi/core" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@node-openapi/core.svg">
  </a>
  <a href="https://www.npmjs.com/package/@node-openapi/core" target="_blank">
    <img alt="Downloads" src="https://img.shields.io/npm/dm/@node-openapi/core.svg">
  </a>
  <a href="https://img.shields.io/npm/l/@node-openapi/core" target="_blank">
    <img alt="License" src="https://img.shields.io/npm/l/@node-openapi/core.svg">
  </a>
</p>

> A collection of TypeScript libraries for building type-safe REST APIs with automatic OpenAPI 3.1 documentation generation using Zod validation.

**Node OpenAPI** provides framework-agnostic tooling to create REST APIs with end-to-end type safety, request/response validation, and automatic OpenAPI documentation. Built on top of [Zod](https://zod.dev/) and [`@asteasolutions/zod-to-openapi`](https://www.npmjs.com/package/@asteasolutions/zod-to-openapi).

## Features

- 🔒 **End-to-end type safety** from request validation to response generation
- 📝 **Automatic OpenAPI 3.1 documentation** generated from your route definitions
- 🛡️ **Runtime validation** for requests and responses using Zod schemas
- 🎯 **Framework adapters** for popular Node.js web frameworks
- 🔧 **Framework agnostic core** that can be extended to any web framework
- 📚 **Comprehensive examples** including a full RealWorld API implementation

## Packages

This monorepo contains the following packages:

### Core Package

| Package | Description | Version |
|---------|-------------|---------|
| [`@node-openapi/core`](./packages/core) | Framework-agnostic core library providing the foundational tools for building OpenAPI adapters | [![npm](https://img.shields.io/npm/v/@node-openapi/core.svg)](https://www.npmjs.com/package/@node-openapi/core) |

### Framework Adapters

| Package | Framework | Description | Version |
|---------|-----------|-------------|---------|
| [`@node-openapi/express`](./packages/express) | Express.js | Express adapter with full middleware support | [![npm](https://img.shields.io/npm/v/@node-openapi/express.svg)](https://www.npmjs.com/package/@node-openapi/express) |
| [`@node-openapi/fastify`](./packages/fastify) | Fastify | High-performance Fastify adapter | [![npm](https://img.shields.io/npm/v/@node-openapi/fastify.svg)](https://www.npmjs.com/package/@node-openapi/fastify) |
| [`@node-openapi/hapi`](./packages/hapi) | Hapi.js | Hapi adapter with plugin architecture support | [![npm](https://img.shields.io/npm/v/@node-openapi/hapi.svg)](https://www.npmjs.com/package/@node-openapi/hapi) |
| [`@node-openapi/hono`](./packages/hono) | Hono | Lightweight Hono adapter for edge computing | [![npm](https://img.shields.io/npm/v/@node-openapi/hono.svg)](https://www.npmjs.com/package/@node-openapi/hono) |
| [`@node-openapi/koa`](./packages/koa) | Koa.js | Koa adapter using koa-router | [![npm](https://img.shields.io/npm/v/@node-openapi/koa.svg)](https://www.npmjs.com/package/@node-openapi/koa) |
| [`@node-openapi/next`](./packages/next) | Next.js | Next.js App Router adapter for API routes | [![npm](https://img.shields.io/npm/v/@node-openapi/next.svg)](https://www.npmjs.com/package/@node-openapi/next) |

### Testing & Development

| Package | Description |
|---------|-------------|
| [`k6-tests`](./packages/k6-tests) | Load testing scripts for performance benchmarking using k6 |

## Quick Start

Choose your framework and get started:

### Express Example

```bash
npm install express @node-openapi/express
```

```typescript
import express from 'express';
import { OpenAPIRouter, createRoute, z } from '@node-openapi/express';

const app = express();
app.use(express.json());

const router = new OpenAPIRouter({ router: app });

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

router.route(pingRoute, async ({ h }) => {
  h.json({ data: { message: 'pong' } });
});

router.doc('/docs', {
  openapi: '3.1.0',
  info: { title: 'API', version: '1.0.0' },
});

app.listen(3000);
```

### Fastify Example

```bash
npm install fastify @node-openapi/fastify
```

```typescript
import Fastify from 'fastify';
import { OpenAPIRouter, createRoute, z } from '@node-openapi/fastify';

const app = Fastify();
const router = new OpenAPIRouter();

const pingRoute = createRoute({
  method: 'get',
  path: '/ping',
  getRoutingPath: () => '/ping',
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

router.doc('/docs', {
  openapi: '3.1.0',
  info: { title: 'API', version: '1.0.0' },
});

router.registerApp(app);
app.listen({ port: 3000 });
```

For more examples with other frameworks, see their respective package documentation.

## Examples

This repository includes comprehensive examples showcasing real-world usage:

### RealWorld API Implementation

Complete implementations of the [RealWorld API specification](https://realworld-docs.netlify.app/docs/specs/backend-specs/introduction) for multiple frameworks:

- **[Base Express](./examples/base-express)** - Full-featured Express implementation with authentication, CRUD operations, and comprehensive OpenAPI documentation
- **[Client](./examples/client)** - TypeScript client with auto-generated types from OpenAPI specs
- **[Database](./examples/db)** - Shared Prisma database layer used across examples
- **[Common](./examples/common)** - Shared domain logic and services

### Framework-Specific Examples

Each framework adapter includes its own example implementation:

- [`examples/express`](./examples/express) - Express.js with middleware and authentication
- [`examples/fastify`](./examples/fastify) - Fastify with plugins and performance optimizations
- [`examples/hapi`](./examples/hapi) - Hapi.js with plugin architecture
- [`examples/hono`](./examples/hono) - Hono for edge computing environments
- [`examples/koa`](./examples/koa) - Koa.js with koa-router
- [`examples/next`](./examples/next) - Next.js App Router API routes

## Architecture

```
┌─────────────────────┐
│   Your Framework    │
│   (Express, etc.)   │
└─────────────────────┘
           │
┌─────────────────────┐
│  Framework Adapter  │
│  (@node-openapi/*)  │
└─────────────────────┘
           │
┌─────────────────────┐
│  @node-openapi/core │
│  (Request/Response  │
│   validation, etc.) │
└─────────────────────┘
           │
┌─────────────────────┐
│       Zod +         │
│ zod-to-openapi     │
└─────────────────────┘
```

## Key Concepts

### Route Definition

Routes are defined using `createRoute` with TypeScript schemas:

```typescript
const userRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({ include: z.string().optional() }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string().email(),
          }).openapi('User'),
        },
      },
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  },
});
```

### Request Validation

All request data (params, query, headers, body) is automatically validated against your Zod schemas:

```typescript
router.route(userRoute, async ({ input, h }) => {
  // input.params.id is typed as string
  // input.query.include is typed as string | undefined
  const user = await getUserById(input.params.id);
  return h.json({ data: user });
});
```

### Response Validation

Responses are optionally validated at runtime to ensure they match your schema:

```typescript
// This will validate the response data against the 200 response schema
return h.json({ data: user }, 200);
```

### OpenAPI Documentation

Documentation is automatically generated from your route definitions:

```typescript
router.doc('/api-docs', {
  openapi: '3.1.0',
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'A type-safe API built with Node OpenAPI',
  },
  servers: [{ url: 'http://localhost:3000' }],
});
```

## Development

This project uses pnpm workspaces for managing multiple packages.

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build-all-lib

# Run tests
pnpm test

# Lint code
pnpm lint
```

### Database Setup (for examples)

```bash
# Reset and seed the database
pnpm reset-db
```

### Running Examples

```bash
# Start the base Express example
cd examples/base-express
pnpm install
pnpm dev

# Test the API
pnpm run-api-test
```

### Load Testing

Performance testing is available using k6:

```bash
# Run load tests against running service
BASE_URL='http://localhost:3000/api' pnpm --filter k6-tests test
```

## Creating Your Own Adapter

The core library is designed to be framework-agnostic. To create an adapter for a new framework:

1. **Extend `RequestLike`** - Create a request adapter for your framework
2. **Extend `CoreOpenAPIRouter`** - Implement the abstract methods
3. **Handle validation** - Integrate Zod validation with your framework's middleware system
4. **Response helpers** - Create typed response helpers

See the [core package documentation](./packages/core) for detailed guidance on creating adapters.

## Contributing

We welcome contributions! Please see our contributing guidelines for details.

### Package Structure

- `packages/core` - Core functionality (framework-agnostic)
- `packages/*` - Framework-specific adapters
- `examples/` - Example applications and implementations

### Testing

- Unit tests with Vitest
- Integration tests with Postman collections
- Load testing with k6
- Type checking with TypeScript

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Built on [Zod](https://zod.dev/) for schema validation
- Uses [`@asteasolutions/zod-to-openapi`](https://www.npmjs.com/package/@asteasolutions/zod-to-openapi) for OpenAPI generation
- Inspired by [Hono](https://hono.dev/)'s type-safe approach to web development
- Implements the [RealWorld API specification](https://realworld-docs.netlify.app/) for comprehensive examples

---

**Node OpenAPI** - Build type-safe APIs with confidence 🚀