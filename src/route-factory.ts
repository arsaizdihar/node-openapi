import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { Request } from './request';
import {
  InputTypeQuery,
  InputTypeHeader,
  InputTypeCookie,
  InputTypeForm,
  InputTypeJson,
  RouteConfig,
  RoutingPath,
  Input,
  InputTypeParam,
  ConvertPathType,
  Handler,
  RouteConfigToHandlerResponse,
} from './utils/type';

export class RouteFactory<Req extends Request> {
  openAPIRegistry: OpenAPIRegistry;

  constructor() {
    this.openAPIRegistry = new OpenAPIRegistry();
  }

  createRoute<
    P extends string,
    R extends Omit<RouteConfig, 'path'> & { path: P },
  >(routeConfig: R) {
    const route = {
      ...routeConfig,
      getRoutingPath(): RoutingPath<R['path']> {
        return routeConfig.path.replaceAll(
          /\/{(.+?)}/g,
          '/:$1',
        ) as RoutingPath<P>;
      },
    };
    return Object.defineProperty(route, 'getRoutingPath', {
      enumerable: false,
    });
  }

  route<
    R extends RouteConfig,
    I extends Input = InputTypeParam<R> &
      InputTypeQuery<R> &
      InputTypeHeader<R> &
      InputTypeCookie<R> &
      InputTypeForm<R> &
      InputTypeJson<R>,
    P extends string = ConvertPathType<R['path']>,
  >(route: R, handler: Handler<Req, P, I, RouteConfigToHandlerResponse<R>>) {
    this.openAPIRegistry.registerPath(route);

    const bodyContent = route.request?.body?.content;

    
  }
}
