import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Context,
  ExtractStatusCode,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  JSONParsed,
  JSONValue,
  MaybePromise,
  RouteConfig,
  RouteConfigStatusCode,
  RouteFactory,
  StatusCode,
  StatusCodeRangeDefinitions,
} from '@node-openapi/core';
import { Env, Handler, Hono, Input, ValidationTargets } from 'hono';
import { BlankEnv, MiddlewareHandler, TypedResponse } from 'hono/types';
import { HonoRequestAdapter } from './request';
import { ZodMediaTypeObject } from '@asteasolutions/zod-to-openapi/dist/openapi-registry';
import { SimplifyDeepArray } from 'hono/utils/types';
import { z, ZodSchema } from 'zod';

export class HonoRouteFactory<
  E extends Env = BlankEnv,
> extends RouteFactory<HonoRequestAdapter> {
  private readonly _middlewares: Array<MiddlewareHandler<E>> = [];

  constructor(private readonly _app = new Hono<E>()) {
    super();
  }

  middleware<R extends MiddlewareHandler<E>>(handler: R) {
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
    ...handlers: Handler<
      any,
      any,
      I,
      R extends {
        responses: {
          [statusCode: number]: {
            content: {
              [mediaType: string]: ZodMediaTypeObject;
            };
          };
        };
      }
        ? MaybePromise<RouteConfigToTypedResponse<R>>
        : MaybePromise<RouteConfigToTypedResponse<R>> | MaybePromise<Response>
    >[]
  ) {
    const _route = this._route(route);
    this._app.on(
      [route.method],
      route.path,
      ...this._middlewares,
      async (c, next) => {
        const context: Context<HonoRequestAdapter> = {
          req: new HonoRequestAdapter(c.req),
          input: {},
        };
        const cResult = await _route(context);
        const input = cResult.input as any;

        for (const key in input) {
          c.req.addValidatedData(key as keyof ValidationTargets, input[key]);
        }

        await next();
      },
      ...handlers,
    );
  }

  doc<P extends string>(path: P, configure: OpenAPIObjectConfigV31): void {
    this._app.get(path, (c) => {
      try {
        const document = this.getOpenAPIDocument(configure);
        return c.json(document);
      } catch (error) {
        return c.json(
          {
            error: error,
          },
          500,
        );
      }
    });
  }

  router<E extends Env>(path: string, routeFactory: HonoRouteFactory<E>) {
    this._app.use(path, ...this._middlewares);
    this._app.route(path, routeFactory._app);

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, routeFactory);
  }
}

export const { createRoute } = HonoRouteFactory;

type DefinedStatusCodes<R extends RouteConfig> = keyof R['responses'] &
  RouteConfigStatusCode;

type ReturnJsonOrTextOrResponse<
  ContentType,
  Content,
  Status extends keyof StatusCodeRangeDefinitions | StatusCode,
> = ContentType extends string
  ? ContentType extends `application/${infer Start}json${infer _End}`
    ? Start extends '' | `${string}+` | `vnd.${string}+`
      ? TypedResponse<
          SimplifyDeepArray<Content> extends JSONValue
            ? JSONValue extends SimplifyDeepArray<Content>
              ? never
              : JSONParsed<Content>
            : never,
          ExtractStatusCode<Status>,
          'json'
        >
      : never
    : ContentType extends `text/plain${infer _Rest}`
      ? TypedResponse<Content, ExtractStatusCode<Status>, 'text'>
      : Response
  : never;

type ExtractContent<T> = T extends {
  [K in keyof T]: infer A;
}
  ? A extends Record<'schema', ZodSchema>
    ? z.infer<A['schema']>
    : never
  : never;

export type RouteConfigToTypedResponse<R extends RouteConfig> =
  | {
      [Status in DefinedStatusCodes<R>]: undefined extends R['responses'][Status]['content']
        ? TypedResponse<{}, ExtractStatusCode<Status>, string>
        : ReturnJsonOrTextOrResponse<
            keyof R['responses'][Status]['content'],
            ExtractContent<R['responses'][Status]['content']>,
            Status
          >;
    }[DefinedStatusCodes<R>]
  | ('default' extends keyof R['responses']
      ? undefined extends R['responses']['default']['content']
        ? TypedResponse<
            {},
            Exclude<StatusCode, ExtractStatusCode<DefinedStatusCodes<R>>>,
            string
          >
        : ReturnJsonOrTextOrResponse<
            keyof R['responses']['default']['content'],
            ExtractContent<R['responses']['default']['content']>,
            Exclude<StatusCode, ExtractStatusCode<DefinedStatusCodes<R>>>
          >
      : never);
