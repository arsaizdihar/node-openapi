export type MaybePromise<T> = T | Promise<T>;
import type {
  RouteConfig as RouteConfigBase,
  ZodContentObject,
  ZodRequestBody,
} from '@asteasolutions/zod-to-openapi';
import { ZodSchema, ZodType, z } from 'zod';
import { Request } from '../request';
import { JSONParsed } from './json';
import {
  ClientErrorStatusCode,
  InfoStatusCode,
  RedirectStatusCode,
  ServerErrorStatusCode,
  StatusCode,
  SuccessStatusCode,
} from './status';

export type RouteConfig = RouteConfigBase;

export type FormValue = string | Blob;
export type ParsedFormValue = string | File;
export type KnownResponseFormat = 'json' | 'text' | 'redirect';
export type ResponseFormat = KnownResponseFormat | string;

export type HandlerResponse<
  Body = unknown,
  StatusCode extends number = number,
  Format extends ResponseFormat = ResponseFormat,
> = {
  status?: StatusCode;
  data?: Body;
  format?: Format;
};

export type Context<Req extends Request, Input = {}> = {
  req: Req;
  input: Input;
};

type ExtractContent<T> = T extends {
  [K in keyof T]: infer A;
}
  ? A extends Record<'schema', ZodSchema>
    ? z.infer<A['schema']>
    : never
  : never;

type StatusCodeRangeDefinitions = {
  '1XX': InfoStatusCode;
  '2XX': SuccessStatusCode;
  '3XX': RedirectStatusCode;
  '4XX': ClientErrorStatusCode;
  '5XX': ServerErrorStatusCode;
};
type RouteConfigStatusCode = keyof StatusCodeRangeDefinitions | StatusCode;
type ExtractStatusCode<T extends RouteConfigStatusCode> =
  T extends keyof StatusCodeRangeDefinitions
    ? StatusCodeRangeDefinitions[T]
    : T;

export type RouteConfigToHandlerResponse<R extends RouteConfig> = {
  [Status in keyof R['responses'] & RouteConfigStatusCode]: IsJson<
    keyof R['responses'][Status]['content']
  > extends never
    ? HandlerResponse<{}, ExtractStatusCode<Status>, string>
    : HandlerResponse<
        JSONParsed<ExtractContent<R['responses'][Status]['content']>>,
        ExtractStatusCode<Status>,
        'json' | 'text'
      >;
}[keyof R['responses'] & RouteConfigStatusCode];

export type RoutingPath<P extends string> =
  P extends `${infer Head}/{${infer Param}}${infer Tail}`
    ? `${Head}/:${Param}${RoutingPath<Tail>}`
    : P;

export type Handler<
  Req extends Request,
  _Path extends string,
  Input = {},
  Res extends HandlerResponse = HandlerResponse,
> = (c: Context<Req, Input>) => MaybePromise<Res>;

export type Input = {
  in?: {};
  out?: {};
  outputFormat?: ResponseFormat;
};

export type ValidationTargets<
  T extends FormValue = ParsedFormValue,
  P extends string = string,
> = {
  json: any;
  form: Record<string, T | T[]>;
  query: Record<string, string | string[]>;
  param: Record<P, P extends `${infer _}?` ? string | undefined : string>;
  header: Record<string, string>;
  cookie: Record<string, string>;
};

export type RequestTypes = {
  body?: ZodRequestBody;
  params?: ZodType;
  query?: ZodType;
  cookies?: ZodType;
  headers?: ZodType | ZodType[];
};

export type IsJson<T> = T extends string
  ? T extends `application/${infer Start}json${infer _End}`
    ? Start extends '' | `${string}+` | `vnd.${string}+`
      ? 'json'
      : never
    : never
  : never;

export type IsForm<T> = T extends string
  ? T extends
      | `multipart/form-data${infer _Rest}`
      | `application/x-www-form-urlencoded${infer _Rest}`
    ? 'form'
    : never
  : never;

export type ConvertPathType<T extends string> =
  T extends `${infer Start}/{${infer Param}}${infer Rest}`
    ? `${Start}/:${Param}${ConvertPathType<Rest>}`
    : T;

export type RequestPart<
  R extends RouteConfig,
  Part extends string,
> = Part extends keyof R['request'] ? R['request'][Part] : {};

type HasUndefined<T> = undefined extends T ? true : false;

type InputTypeBase<
  R extends RouteConfig,
  Part extends string,
  Type extends keyof ValidationTargets,
> = R['request'] extends RequestTypes
  ? RequestPart<R, Part> extends ZodType
    ? {
        in: {
          [K in Type]: HasUndefined<ValidationTargets[K]> extends true
            ? {
                [K2 in keyof z.input<
                  RequestPart<R, Part>
                >]?: ValidationTargets[K][K2];
              }
            : {
                [K2 in keyof z.input<
                  RequestPart<R, Part>
                >]: ValidationTargets[K][K2];
              };
        };
        out: { [K in Type]: z.output<RequestPart<R, Part>> };
      }
    : {}
  : {};

export type InputTypeJson<R extends RouteConfig> =
  R['request'] extends RequestTypes
    ? R['request']['body'] extends ZodRequestBody
      ? R['request']['body']['content'] extends ZodContentObject
        ? IsJson<keyof R['request']['body']['content']> extends never
          ? {}
          : R['request']['body']['content'][keyof R['request']['body']['content']] extends Record<
                'schema',
                ZodSchema<any>
              >
            ? {
                in: {
                  json: z.input<
                    R['request']['body']['content'][keyof R['request']['body']['content']]['schema']
                  >;
                };
                out: {
                  json: z.output<
                    R['request']['body']['content'][keyof R['request']['body']['content']]['schema']
                  >;
                };
              }
            : {}
        : {}
      : {}
    : {};

export type InputTypeForm<R extends RouteConfig> =
  R['request'] extends RequestTypes
    ? R['request']['body'] extends ZodRequestBody
      ? R['request']['body']['content'] extends ZodContentObject
        ? IsForm<keyof R['request']['body']['content']> extends never
          ? {}
          : R['request']['body']['content'][keyof R['request']['body']['content']] extends Record<
                'schema',
                ZodSchema<any>
              >
            ? {
                in: {
                  form: z.input<
                    R['request']['body']['content'][keyof R['request']['body']['content']]['schema']
                  >;
                };
                out: {
                  form: z.output<
                    R['request']['body']['content'][keyof R['request']['body']['content']]['schema']
                  >;
                };
              }
            : {}
        : {}
      : {}
    : {};

export type InputTypeParam<R extends RouteConfig> = InputTypeBase<
  R,
  'params',
  'param'
>;
export type InputTypeQuery<R extends RouteConfig> = InputTypeBase<
  R,
  'query',
  'query'
>;
export type InputTypeHeader<R extends RouteConfig> = InputTypeBase<
  R,
  'headers',
  'header'
>;
export type InputTypeCookie<R extends RouteConfig> = InputTypeBase<
  R,
  'cookies',
  'cookie'
>;

export type RouteHandler<
  Req extends Request,
  R extends RouteConfig,
  I extends Input = InputTypeParam<R> &
    InputTypeQuery<R> &
    InputTypeHeader<R> &
    InputTypeCookie<R> &
    InputTypeForm<R> &
    InputTypeJson<R>,
  P extends string = ConvertPathType<R['path']>,
> = Handler<Req, P, I, RouteConfigToHandlerResponse<R>>;
