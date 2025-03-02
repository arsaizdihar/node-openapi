import {
  Context,
  Input,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  RouteConfig,
  RouteConfigToHandlerResponse,
  RouteFactory,
} from '@node-openapi/core';
import express, {
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import z, { ZodError } from 'zod';
import { ExpressRequestAdapter } from './request';

// const app = express();

// app.use(express.json());

export class ExpressRouteFactory extends RouteFactory<ExpressRequestAdapter> {
  constructor(private readonly app: Express) {
    super();
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
    handler: RequestHandler<
      Record<string, string>,
      RouteConfigToHandlerResponse<R>['data'],
      'json' extends keyof I['out'] ? I['out']['json'] : any,
      'params' extends keyof I['out'] ? I['out']['params'] : any,
      I['out'] extends {} ? I['out'] : any
    >,
  ) {
    const _route = this._route(route);
    this.app[route.method](
      route.path,
      async (req, res, next) => {
        const context: Context<ExpressRequestAdapter> = {
          req: new ExpressRequestAdapter(req as any),
          input: {},
        };
        try {
          const c = await _route(context);
          res.locals = c.input as any;
          next();
        } catch (error) {
          next(error);
          return;
        }
      },
      handler,
    );
  }
}

const app = express();
app.use(express.json());
const factory = new ExpressRouteFactory(app);

const route = factory.createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
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
