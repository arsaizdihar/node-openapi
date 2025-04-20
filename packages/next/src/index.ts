import {
  Context,
  Input,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  Prettify,
  RouteConfig,
  RouteFactory,
} from '@node-openapi/core';
import { NextRequestAdapter } from './request';
import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import { NextHandler, NextRouteContext } from './helper';
import { NextRequest, NextResponse } from 'next/server';
import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

type NextMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD';

const nextMethods: NextMethod[] = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS',
  'HEAD',
];

export class NextRouteFactory extends RouteFactory<NextRequestAdapter> {
  private _handlers: Record<NextMethod, NextHandler | undefined> = {
    GET: undefined,
    POST: undefined,
    PUT: undefined,
    DELETE: undefined,
    PATCH: undefined,
    OPTIONS: undefined,
    HEAD: undefined,
  };

  constructor() {
    super();
  }

  doc<P extends string>(
    _path: P,
    configure: OpenAPIObjectConfigV31,
  ): NextHandler<ReturnType<OpenApiGeneratorV31['generateDocument']>> {
    return async () => {
      const document = this.getOpenAPIDocument(configure);
      return NextResponse.json(document);
    };
  }

  router(routeFactory: NextRouteFactory) {
    this._registerRouter('/', routeFactory);
  }

  handler<
    R extends RouteConfig,
    I extends Input = InputTypeParam<R> &
      InputTypeQuery<R> &
      InputTypeHeader<R> &
      InputTypeCookie<R> &
      InputTypeForm<R> &
      InputTypeJson<R>,
  >(
    route: R,
    handler: NextHandler<
      'json' extends keyof I['out'] ? I['out']['json'] : any,
      NextRouteContext<
        'params' extends keyof I['out'] ? I['out']['params'] : any
      > & {
        input: Prettify<I['out']>;
      }
    >,
  ) {
    const _route = this._route(route);

    const finalHandler = async (req: NextRequest, ctx: NextRouteContext) => {
      const context: Context<NextRequestAdapter> = {
        req: new NextRequestAdapter(req, ctx.params),
        input: {},
      };
      const c = await _route(context);
      const input = c.input as any;

      const nextCtx = {
        ...ctx,
        input,
      };

      return handler(req, nextCtx as any);
    };

    const method = route.method.toUpperCase() as NextMethod;
    if (!nextMethods.includes(method)) {
      throw new Error(`Invalid method: ${method}`);
    }

    this._handlers[method] = finalHandler;

    return this;
  }

  get handlers(): Readonly<Record<NextMethod, NextHandler | undefined>> {
    return this._handlers;
  }
}

export { z };
