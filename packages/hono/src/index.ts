import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import {
  Context as CoreContext,
  InputTypeCookie,
  InputTypeForm,
  InputTypeHeader,
  InputTypeJson,
  InputTypeParam,
  InputTypeQuery,
  OpenAPIDefinitions,
  RouteConfig,
  RouteFactory,
  z,
} from '@node-openapi/core';
import {
  Env,
  Handler,
  Hono,
  Context as HonoContext,
  Input,
  MiddlewareHandler,
  Next,
  ValidationTargets,
} from 'hono';
import { BlankEnv } from 'hono/types';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { HonoRequestAdapter } from './request';
import { HandlerWithTypedResponse, RouteConfigToTypedResponse } from './type';

export class HonoRouteFactory<
  E extends Env = BlankEnv,
> extends RouteFactory<HonoRequestAdapter> {
  private readonly _middlewares: Array<MiddlewareHandler<E>> = [];
  public readonly app: Hono<E>;
  private readonly _validateResponse: boolean;

  constructor(
    options: {
      app?: Hono<E>;
      validateResponse?: boolean;
    } = {},
  ) {
    super();
    this.app = options.app ?? new Hono<E>();
    this._validateResponse = options.validateResponse ?? true;
  }

  extend<NewEnv extends Env>(): HonoRouteFactory<NewEnv> {
    const factory = new HonoRouteFactory<NewEnv>({
      validateResponse: this._validateResponse,
    });
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
    ...handlers: HandlerWithTypedResponse<
      R,
      E,
      R['path'],
      ValidationInput,
      RouteConfigToTypedResponse<R>
    >[]
  ) {
    const _coreRouteProcessor = this._route(routeConfig);

    this.app.on(
      [routeConfig.method],
      routeConfig.getRoutingPath(),
      async (c: HonoContext<E>, next) => {
        const helper = HonoRouteFactory._createHelper(
          {
            json: (data: any, status: ContentfulStatusCode) => {
              return c.json(data, status) as any;
            },
            text: (data: string, status: ContentfulStatusCode) => {
              return c.text(data, status) as any;
            },
          },
          this._validateResponse ? routeConfig : undefined,
        );
        (c as any).typedJson = helper.json;
        (c as any).typedText = helper.text;
        return next();
      },
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
      ...(handlers as Handler[]),
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

export { z } from '@node-openapi/core';
export type { OpenAPIDefinitions, RouteConfig };
