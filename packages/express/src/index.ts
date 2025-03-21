import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Context,
  Input,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  mergePath,
  RouteConfig,
  RouteConfigToHandlerResponse,
  RouteFactory,
} from '@node-openapi/core';
import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from 'express';
import swaggerUi from 'swagger-ui-express';
import z, { ZodError } from 'zod';
import { ExpressRequestAdapter } from './request';

// const app = express();

// app.use(express.json());

export class ExpressRouteFactory extends RouteFactory<ExpressRequestAdapter> {
  private readonly _middlewares: Array<RequestHandler> = [];

  constructor(private readonly _router: Router) {
    super();
  }

  middleware<R extends RequestHandler>(handler: R) {
    this._middlewares.push(handler);
  }

  route<
    R extends RouteConfig,
    I extends Input = InputTypeParam<R> &
      InputTypeQuery<R> &
      InputTypeHeader<R> &
      InputTypeCookie<R> &
      InputTypeForm<R> &
      InputTypeJson<R>,
  >(
    route: R,
    ...handlers: Array<
      RequestHandler<
        Record<string, string>,
        RouteConfigToHandlerResponse<R>['data'],
        'json' extends keyof I['out'] ? I['out']['json'] : any,
        'query' extends keyof I['out'] ? I['out']['query'] : any,
        I['out'] extends {} ? I['out'] : any
      >
    >
  ) {
    const _route = this._route(route);
    this._router[route.method](
      route.path,
      async (req, res, next) => {
        let nextCalled = false;
        let error: Error | string | undefined;

        const _next = (err?: Error | string) => {
          nextCalled = true;
          if (err) {
            error = err;
          }
        };

        for (const middleware of this._middlewares) {
          nextCalled = false;
          await middleware(req as any, res as any, _next);

          // If next wasn't called, assume middleware handled the response
          if (!nextCalled) {
            return;
          }

          // If there was an error, pass it to the next error handler
          if (error) {
            next(error);
            return;
          }
        }

        // Continue to the next middleware in the route
        next();
      },
      async (req, res, next) => {
        const context: Context<ExpressRequestAdapter> = {
          req: new ExpressRequestAdapter(req as any),
          input: {},
        };
        try {
          const c = await _route(context);
          const input = c.input as any;
          res.locals = {
            ...res.locals,
            ...input,
          };
          next();
        } catch (error) {
          next(error);
          return;
        }
      },
      ...handlers,
    );
  }

  router(path: string, routeFactory: ExpressRouteFactory) {
    this._router.use(path, routeFactory._router);

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');

    routeFactory.openAPIRegistry.definitions.forEach((def) => {
      switch (def.type) {
        case 'component':
          return this.openAPIRegistry.registerComponent(
            def.componentType,
            def.name,
            def.component,
          );

        case 'route':
          return this.openAPIRegistry.registerPath({
            ...def.route,
            path: mergePath(pathForOpenAPI, def.route.path),
          });

        case 'webhook':
          return this.openAPIRegistry.registerWebhook({
            ...def.webhook,
            path: mergePath(pathForOpenAPI, def.webhook.path),
          });

        case 'schema':
          return this.openAPIRegistry.register(
            def.schema._def.openapi._internal.refId,
            def.schema,
          );

        case 'parameter':
          return this.openAPIRegistry.registerParameter(
            def.schema._def.openapi._internal.refId,
            def.schema,
          );

        default: {
          const errorIfNotExhaustive: never = def;
          throw new Error(`Unknown registry type: ${errorIfNotExhaustive}`);
        }
      }
    });
  }

  doc<P extends string>(path: P, configure: OpenAPIObjectConfigV31) {
    this._router.get(path, (_, res) => {
      try {
        const document = this.getOpenAPIDocument(configure);
        res.json(document);
      } catch (error) {
        console.log(error);
        res.status(500).json({
          error: error,
        });
      }
    });
  }
}

export const { createRoute } = ExpressRouteFactory;

const app = express();
app.use(express.json());
const factory = new ExpressRouteFactory(app);

const route = ExpressRouteFactory.createRoute({
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

factory.route(route, async (_, res) => {
  res.status(200).json({
    message: res.locals.json.message,
  });
});

factory.doc('/docs', {
  openapi: '3.1.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: '/docs',
    },
  }),
);

const errorHandler = (
  err: Error,
  _: Request,
  res: Response,
  __: NextFunction,
) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: err,
    });
    return;
  }

  res.status(500).json({
    message: 'Internal Server Error',
  });
};

app.use(errorHandler);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
