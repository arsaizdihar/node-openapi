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
import express, { Express, RequestHandler } from 'express';
import z from 'zod';
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
    this.app[route.method](
      route.path,
      async (req, res, next) => {
        const context: Context<ExpressRequestAdapter> = {
          req: new ExpressRequestAdapter(req as any),
          input: {},
        };
        const c = await this._route(route, context);

        res.locals = c.input as any;
        next();
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

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
