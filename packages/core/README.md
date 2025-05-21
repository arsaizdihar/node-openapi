# @node-openapi/core

## Motivation

`@node-openapi/core` is the foundational library for building framework-specific adapters that integrate [Zod](https://zod.dev/) for validation with [OpenAPI](https://www.openapis.org/) documentation generation. The primary goal is to provide a framework-agnostic solution that ensures end-to-end type safety, from request validation to response generation, all while automatically producing comprehensive OpenAPI documentation.

**Under the hood, `@node-openapi/core` builds on [`@asteasolutions/zod-to-openapi`](https://www.npmjs.com/package/@asteasolutions/zod-to-openapi) for schema definitions and OpenAPI document generation, ensuring that the `RouteConfig`, `OpenAPIObjectConfig`, and related APIs are identical to those provided by `zod-to-openapi`.**

This core library is not intended for direct installation and use in applications. Instead, it provides the necessary tools and abstractions for developers to create adapters for specific web frameworks (e.g., Express, Fastify, Hono).

## Core Components

The library revolves around the `RouteFactory` abstract class, along with several helper types and utilities.

### `RouteFactory<Req extends RequestLike, FormValueType>`

This is the abstract base class that framework adapters must extend.

- **`constructor()`**: Initializes an `OpenAPIRegistry` instance for collecting route definitions.
- **`static getRoutingPath<P extends string>(path: P): string`**: A static utility to convert OpenAPI-style path parameters (e.g., `/users/{id}`) to a framework-specific format (e.g., `/users/:id`). Adapters can use this or implement their own logic.
- **`static createRoute<R extends RouteConfig>(routeConfig: R): R & { getRoutingPath: () => string }`**: A static factory method to create a route configuration object. It also attaches a `getRoutingPath` method to the route object itself, which uses the static `RouteFactory.getRoutingPath` by default.
- **`protected _route<R extends RouteConfig, I extends Input>(route: R): (c: Context<Req>) => Promise<Context<Req, I>>`**:
  This protected method is crucial for integrating request validation.
  1.  It registers the provided `route` configuration with the `openAPIRegistry`.
  2.  It inspects the `route.request` object for schema definitions (query, params, headers, cookies, body content for JSON, form-data, x-www-form-urlencoded, text/plain).
  3.  For each defined schema, it creates a validation middleware using `this.zValidator()`.
  4.  It returns an asynchronous function that, when called with a `Context` object, executes all registered validators and returns the context, now populated with validated input.
- **`abstract doc<P extends string>(path: P, configure: OpenAPIObjectConfigV31): void`**:
  An abstract method that adapters must implement. This method is responsible for setting up a route (at the given `path`) that serves the OpenAPI documentation (generated via `getOpenAPIDocument`) in JSON format.
- **`getOpenAPIDocument(config: OpenAPIObjectConfig, additionalDefinitions?: OpenAPIDefinitions[]): OpenAPIObject`**:
  Generates the complete OpenAPI document (version 3.1) based on all routes and components registered with the `openAPIRegistry`.
- **`zValidator<T extends ZodSchema, Target extends keyof ValidationTargets, ...>(target: Target, schema: T): MiddlewareHandler<Req, I>`**:
  Creates a middleware function for a specific part of the request (`target`: 'query', 'json', 'form', 'text', 'header', 'cookie', 'param'). This middleware parses and validates the incoming data against the provided Zod `schema`. Validated data is then attached to `c.input[target]`.
- **`protected _registerRouter(pathForOpenAPI: string, routeFactory: RouteFactory<Req>): void`**:
  A utility to merge OpenAPI definitions from a "sub-router" (another `RouteFactory` instance) into the current factory's registry. Paths from the sub-router are prefixed with `pathForOpenAPI`.
- **`private static _validateResponse<R>(config: RouteConfig, response: R, contentType: string, status: number): R | ZodError`**:
  A static utility to validate response data against the schema defined in the route's `responses` configuration for a given status code and content type.
- **`protected static _createHelper<R extends RouteConfig, SendReturn>(send: ResponseSender<SendReturn>, config?: R): Helper<R, SendReturn>`**:
  A static factory method to create a `Helper` object for sending typed and (optionally) validated responses. It takes a `ResponseSender` adapter and an optional `RouteConfig`. If `config` is provided, responses sent via the helper (e.g., `h.json()`, `h.text()`) will be validated against the schemas defined in `config.responses`.

### `ResponseSender<ReturnType>`

An interface that adapters need to implement to define how responses are actually sent by the underlying framework.
It requires two methods:

- `json(data: any, status: number): ReturnType`
- `text(data: string, status: number): ReturnType`

### `ResponseValidationError`

An `Error` subclass thrown by `_validateResponse` (and consequently by the response helper created via `_createHelper`) when response validation fails. It contains the original `ZodError` in its `zodError` property.

### `RequestLike<FormValueType>`

An abstract class that framework adapters must extend to provide a standardized way of accessing request data (URL, method, headers, body, JSON, form data, query parameters, cookies, and route parameters).

### `mergePath(...paths: string[]): string`

A utility function to intelligently merge URL path segments. For example, `mergePath('/api/', '/users')` results in `'/api/users'`.

### `z`

A re-export of the Zod library itself (`import { z } from 'zod'`).

## Type Utilities

The `@node-openapi/core` library exports various TypeScript types from its `type.ts`, `json.ts`, and `status.ts` modules to aid in creating strongly-typed adapters and route handlers.

Key type exports include:

- From `type.ts`:
  - `MaybePromise<T>`: Represents a value that can be `T` or `Promise<T>`.
  - `RouteConfig`: The core configuration object for a route, based on `zod-to-openapi`.
  - `Context<Req extends RequestLike, I extends Input = {}>`: The context object passed to handlers, containing the request (`req`) and validated input (`input`).
  - `InputTypeParam<R extends RouteConfig>`, `InputTypeQuery<R extends RouteConfig>`, etc.: Types that extract the expected input/output shapes for different parts of the request based on a `RouteConfig`.
  - `RouteConfigToHandlerResponse<R extends RouteConfig>`: Infers the possible response types (including data shape, status, and format) a handler for a given `RouteConfig` can send.
  - `Helper<R extends RouteConfig, ReturnType = void>`: The type for the response helper object (`h`).
  - `StatusCode`: A union of all valid HTTP status codes.
- From `json.ts`:
  - `JSONValue`, `JSONObject`, `JSONArray`, `JSONPrimitive`: Standard JSON types.
  - `JSONParsed<T>`: A utility type that attempts to infer the shape of `T` after it has been parsed from JSON (e.g., converting `Date` objects to strings).
- From `status.ts`:
  - `InfoStatusCode`, `SuccessStatusCode`, `RedirectStatusCode`, `ClientErrorStatusCode`, `ServerErrorStatusCode`: Specific groups of HTTP status codes.

These types are used extensively within the core library and are designed to provide excellent autocompletion and type checking for adapter implementers and end-users.

## How to Make an Adapter

Creating an adapter for a new framework involves the following steps:

1.  **Create a `RequestAdapter` class**:
    This class must extend `RequestLike<FormValueType>`. It needs to implement all abstract methods (`url`, `method`, `headers`, `body`, `json`, `query`, `cookies`, `params`) to fetch the respective data from the framework's native request object.
    You might also override the `form` getter if your framework handles form data.

    _Example (simplified from Express adapter)_:

    ```typescript
    import { RequestLike } from '@node-openapi/core';
    import { Request as ExpressRequest } from 'express';

    export class MyFrameworkRequestAdapter extends RequestLike {
      constructor(private req: ExpressRequest) {
        super();
      }
      get url() { return this.req.originalUrl; }
      get method() { return this.req.method; }
      get headers() { return this.req.headers as Record<string, string | string[] | undefined>; }
      async get body() { /* ... read body ... */ return ''; }
      async get json() { return this.req.body; } // Assuming body-parser middleware
      get query() { return this.req.query as any; }
      get cookies() { return this.req.cookies as any; } // Assuming cookie-parser middleware
      async get params() { return this.req.params as any; }
    }
    ```

2.  **Create a `FrameworkRouteFactory` class**:
    This class must extend `RouteFactory<YourRequestAdapterClass>`.

    ```typescript
    import { RouteFactory, RouteConfig, OpenAPIObjectConfigV31, OpenAPIDefinitions } from '@node-openapi/core';
    import { MyFrameworkRequestAdapter } from './request'; // Your adapter from step 1
    // Import necessary types/functions from your framework
    // e.g., Router, RequestHandler, Response objects for Express

    export class MyFrameworkRouteFactory<
      TContext extends Record<string, any> = Record<string, any>
      // You can add framework specific generics like Locals for Express
    > extends RouteFactory<MyFrameworkRequestAdapter> {

      private readonly _router: YourFrameworkRouterType; // e.g., express.Router

      constructor(options: { router?: YourFrameworkRouterType, validateResponse?: boolean } = {}) {
        super();
        this._router = options.router ?? new YourFrameworkRouter(); // Initialize or get router
        // Store validateResponse option if you want to make response validation configurable
      }

      // Implement the abstract 'doc' method
      doc<P extends string>(
        path: P,
        configure: OpenAPIObjectConfigV31,
        additionalDefinitions?: OpenAPIDefinitions[],
      ): void {
        this._router.get(path, (fwReq, fwRes, fwNext) => { // Adapt to your framework's handler signature
          try {
            const document = this.getOpenAPIDocument(configure, additionalDefinitions);
            fwRes.json(document); // Send JSON response using framework's response object
          } catch (error) {
            fwNext(error); // Pass error to framework's error handler
          }
        });
      }

      // Implement your main 'route' method
      route<R extends RouteConfig & { getRoutingPath: () => string }, ...>(
        routeConfig: R,
        ...handlers: YourFrameworkSpecificHandlerType[]
      ): void {
        const coreValidatorMiddleware = this._route(routeConfig); // Get the core validation middleware

        // 1. Create a framework-specific middleware that uses coreValidatorMiddleware
        const validationMiddleware = async (fwReq, fwRes, fwNext) => {
          const requestAdapter = new MyFrameworkRequestAdapter(fwReq);
          const context: Context<MyFrameworkRequestAdapter> = {
            req: requestAdapter,
            input: {},
          };
          try {
            const { input } = await coreValidatorMiddleware(context);
            // Store 'input' in a place accessible by subsequent handlers
            // (e.g., on fwReq, or a custom context object)
            (fwReq as any).validatedInput = input;
            fwNext();
          } catch (error) {
            fwNext(error); // Pass ZodErrors or others to the framework's error handler
          }
        };

        // 2. Adapt user-provided handlers to the framework's expected signature.
        //    This involves:
        //    - Creating the response helper 'h' using `MyFrameworkRouteFactory._createHelper`.
        //    - Providing access to validated input.
        const adaptedHandlers = handlers.map(handler =>
          (fwReq, fwRes, fwNext) => {
            const responseSender: ResponseSender<void> = { // Or whatever your framework returns
                json: (data, status) => { fwRes.status(status ?? 200).json(data); },
                text: (data, status) => { fwRes.status(status ?? 200).type('text/plain').send(data); }
            };
            const helper = MyFrameworkRouteFactory._createHelper(
                responseSender,
                /* pass routeConfig if response validation is enabled */
            );

            const handlerArgs = {
              req: fwReq, // Native framework request
              res: fwRes, // Native framework response
              input: (fwReq as any).validatedInput, // Validated input from previous middleware
              h: helper,
              // context: any custom context you want to provide
            };

            // Call the user's handler
            // Handle Promise returns if your framework doesn't do it automatically
            Promise.resolve(handler(handlerArgs, fwNext)).catch(fwNext);
          }
        );

        // 3. Register the path and method with your framework's router
        this._router[routeConfig.method.toLowerCase()](
          routeConfig.getRoutingPath(), // Use the path from the route config
          validationMiddleware,
          ...adaptedHandlers
        );
      }

      // Optional: Implement a 'router' or 'use' method to nest factories
      router(path: string, subFactory: MyFrameworkRouteFactory): void {
        this._router.use(path, subFactory._router); // Mount sub-router
        const pathForOpenAPI = path.replace(/:([^/]+)/g, '{$1}'); // Convert framework path to OpenAPI path
        this._registerRouter(pathForOpenAPI, subFactory); // Register with core
      }

      // Optional: Add framework-specific middleware support
      // middleware(...) { ... }

      // Expose the underlying router
      getRawRouter() {
        return this._router;
      }
    }
    ```

3.  **Re-export `createRoute` and `z` **:
    It's good practice to re-export `createRoute` and zod `z` from your `FrameworkRouteFactory` for a better user experience.

    ```typescript
    export const { createRoute, z } = MyFrameworkRouteFactory;
    ```

4.  **Documentation and Examples**:
    Provide clear documentation and examples for your adapter, showing users how to define routes, use Zod schemas for validation, handle requests, and send typed responses. Referencing the `@node-openapi/express` package can be a good source of inspiration.

By following these steps, you can create a robust, type-safe adapter for any Node.js web framework, leveraging the power of Zod and OpenAPI through `@node-openapi/core`.
Remember to handle errors appropriately, typically by passing them to the framework's next/error handling mechanism so users can install their own error reporting middlewares.
The `Context` object in `@node-openapi/core` primarily serves the internal validation pipeline. Your adapter will likely introduce its own request context or arguments for user-facing handlers, incorporating the validated `input` and the response `helper`.
