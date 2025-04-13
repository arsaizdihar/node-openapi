import { ExpressRouteFactory } from '@node-openapi/express';

export class BaseController {
  public readonly factory = new ExpressRouteFactory();
}
