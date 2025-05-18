import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Context as CoreContext,
  HandlerResponse,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  MaybePromise,
  OpenAPIDefinitions,
  RouteConfig,
  RouteConfigToHandlerResponse,
  RouteFactory,
  z,
} from '@node-openapi/core';
import {
  Context as HonoContext,
  Env,
  Handler,
  Hono,
  Input,
  MiddlewareHandler,
  Next,
  ValidationTargets,
} from 'hono';
import { BlankEnv, TypedResponse } from 'hono/types';
import { StatusCode } from 'hono/utils/http-status';
import { HonoRequestAdapter } from './request';
import { ZodMediaTypeObject } from '@asteasolutions/zod-to-openapi';

export class HonoRouteFactory<
  E extends Env = BlankEnv,
> extends RouteFactory<HonoRequestAdapter> {
  private readonly _middlewares: Array<MiddlewareHandler<E>> = [];

  constructor(public readonly app = new Hono<E>()) {
    super();
  }

  extend<NewEnv extends Env>(): HonoRouteFactory<NewEnv> {
    const factory = new HonoRouteFactory<NewEnv>();
    factory._middlewares.push(
      ...(this._middlewares as unknown as MiddlewareHandler<NewEnv>[]),
    );
    return factory;
  }

  middleware(handler: MiddlewareHandler<E>) {
    this._middlewares.push(handler);
  }

  route<
    R extends RouteConfig & { getRoutingPath: () => string },
    ValidationInput extends Input = InputTypeParam<R> &
      InputTypeQuery<R> &
      InputTypeHeader<R> &
      InputTypeCookie<R> &
      InputTypeForm<R> &
      InputTypeJson<R>,
  >(
    routeConfig: R,
    ...handlers: Handler<
      E,
      R['path'],
      ValidationInput,
      // If response type is defined, only TypedResponse is allowed.
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
    const _coreRouteProcessor = this._route(routeConfig);

    this.app.on(
      [routeConfig.method],
      routeConfig.getRoutingPath(),
      ...this._middlewares,
      async (c: HonoContext<E>, next: Next) => {
        const coreProcessingContext: CoreContext<HonoRequestAdapter> = {
          req: new HonoRequestAdapter(c.req),
          input: {},
        };

        try {
          const validationResult = await _coreRouteProcessor(
            coreProcessingContext,
          );
          const validatedData = validationResult.input as any;

          for (const key in validatedData) {
            if (validatedData[key] !== undefined) {
              c.req.addValidatedData(
                key as keyof ValidationTargets,
                validatedData[key],
              );
            }
          }
          await next();
        } catch (error) {
          if (error instanceof z.ZodError) {
            return c.json({ name: 'ZodError', issues: error.issues }, 400);
          }
          console.error(
            '[NodeAPI Hono Adapter] Internal validation error:',
            error,
          );
          return c.json({ error: 'Internal Server Error' }, 500);
        }
      },
      ...handlers,
    );
  }

  doc<P extends string>(
    path: P,
    openapiConfig: OpenAPIObjectConfigV31,
    additionalDefinitions?: OpenAPIDefinitions[],
  ): void {
    this.app.get(path, (c: HonoContext<E>) => {
      try {
        const document = this.getOpenAPIDocument(
          openapiConfig,
          additionalDefinitions,
        );
        return c.json(document);
      } catch (error) {
        console.error(
          '[NodeAPI Hono Adapter] Error generating OpenAPI document:',
          error,
        );
        return c.json({ message: 'Failed to generate OpenAPI document' }, 500);
      }
    });
  }

  router<SubEnv extends Env>(
    path: string,
    subRouteFactory: HonoRouteFactory<SubEnv>,
  ) {
    this.app.route(path, subRouteFactory.app as Hono<any>);

    const pathForOpenAPI = path.replaceAll(/:([^/]+)/g, '{$1}');
    this._registerRouter(pathForOpenAPI, subRouteFactory);
  }
}

export const { createRoute } = HonoRouteFactory;

export type RouteConfigToTypedResponse<R extends RouteConfig> =
  RouteConfigToHandlerResponse<R> extends HandlerResponse<
    infer Body,
    infer Status,
    infer Format
  >
    ? TypedResponse<
        Body,
        Status extends StatusCode ? Status : StatusCode,
        Format extends string ? Format : string
      >
    : TypedResponse<any, StatusCode, string>;

export { z } from '@node-openapi/core';
export type { OpenAPIDefinitions, RouteConfig };
