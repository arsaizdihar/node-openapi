import express, {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import z from 'zod';
import { Request } from './request';
import { RouteFactory } from './route-factory';
import { HandlerResponse, MaybePromise, Handler, Context } from './utils/type';

const app = express();

app.use(express.json());
export class ExpressRequestAdapter extends Request {
  constructor(private readonly req: ExpressRequest) {
    super();
  }

  override get body(): MaybePromise<string> {
    return this.req.body;
  }

  override get url(): string {
    return this.req.url;
  }

  override get method(): string {
    return this.req.method;
  }

  override get headers() {
    return this.req.headers;
  }

  override get json(): MaybePromise<unknown> {
    return this.req.body;
  }

  override get query() {
    return this.req.query as Record<string, string | string[] | undefined>;
  }
}

export class ExpressRouteFactory extends RouteFactory<ExpressRequestAdapter> {
  toExpressHandler<P extends string>(
    handler: Handler<ExpressRequestAdapter, P, any, HandlerResponse>,
  ) {
    return async (req: ExpressRequest, res: ExpressResponse) => {
      const context: Context<ExpressRequestAdapter> = {
        req: new ExpressRequestAdapter(req),
        input: {},
      };
      const result = await handler(context);
      if (result.status) {
        res.status(result.status);
      }

      if (result.format === 'json') {
        res.json(result.data);
      }
    };
  }
}

const factory = new ExpressRouteFactory();

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

const handler = factory.route(route, async (c) => {
  return {
    status: 200,
    data: {
      message: c.input.json.message,
    },
    format: 'json',
  };
});

app.all('*', factory.toExpressHandler(handler));

// app.post('/', async (req, res) => {
//   const json = req.body;
//   res.json(json);
// });

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
