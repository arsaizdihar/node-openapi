/**
 * Type utility for values that may be synchronous or Promise-based
 */
export type MaybePromise<T> = T | Promise<T>;
import type {
  RouteConfig as RouteConfigBase,
  ZodContentObject,
  ZodRequestBody,
} from '@asteasolutions/zod-to-openapi';
import { ZodSchema, ZodType, z } from 'zod';
import { RequestLike } from './request';
import { JSONParsed, JSONValue } from './json';
import {
  ClientErrorStatusCode,
  InfoStatusCode,
  RedirectStatusCode,
  ServerErrorStatusCode,
  StatusCode,
  SuccessStatusCode,
} from './status';

/**
 * Route configuration type from zod-to-openapi
 */
export type RouteConfig = RouteConfigBase;

/**
 * Standard response formats supported by the framework
 */
export type KnownResponseFormat = 'json' | 'text' | 'redirect';

/**
 * Response format - either a known format or custom string
 */
export type ResponseFormat = KnownResponseFormat | string;

/**
 * Generic handler response structure with status code, body data, and format
 * @template Body - Type of the response body
 * @template StatusCode - HTTP status code
 * @template Format - Response format (json, text, etc.)
 */
export type HandlerResponse<
  Body = unknown,
  Status extends StatusCode = StatusCode,
  Format extends ResponseFormat = ResponseFormat,
> = {
  status: Status;
  data: Body;
  format: Format;
};

/**
 * Request context object passed to route handlers
 * @template Req - Request type
 * @template I - Input type containing parsed and validated data
 */
export type Context<Req extends RequestLike, I extends Input = {}> = {
  req: Req;
  input: I['out'];
};

/**
 * Utility type to extract content schema from OpenAPI content object
 */
type ExtractContent<T> = T extends {
  [K in keyof T]: infer A;
}
  ? A extends Record<'schema', ZodSchema>
    ? z.infer<A['schema']>
    : never
  : never;

/**
 * Maps status code ranges to specific status codes
 */
export type StatusCodeRangeDefinitions = {
  '1XX': InfoStatusCode;
  '2XX': SuccessStatusCode;
  '3XX': RedirectStatusCode;
  '4XX': ClientErrorStatusCode;
  '5XX': ServerErrorStatusCode;
};
export type RouteConfigStatusCode =
  | keyof StatusCodeRangeDefinitions
  | StatusCode;

export type ExtractStatusCode<T extends RouteConfigStatusCode> =
  T extends keyof StatusCodeRangeDefinitions
    ? StatusCodeRangeDefinitions[T]
    : T;

export type DefinedStatusCodes<R extends RouteConfig> = keyof R['responses'] &
  RouteConfigStatusCode;

/**
 * Useful to flatten the type output to improve type hints shown in editors. And also to transform an interface into a type to aide with assignability.
 * @copyright from sindresorhus/type-fest
 */
export type Simplify<T> = {
  [KeyType in keyof T]: T[KeyType];
} & {};

/**
 * A simple extension of Simplify that will deeply traverse array elements.
 */
export type SimplifyDeepArray<T> = T extends any[]
  ? {
      [E in keyof T]: SimplifyDeepArray<T[E]>;
    }
  : Simplify<T>;

type ReturnJsonOrTextOrResponse<
  ContentType,
  Content,
  Status extends keyof StatusCodeRangeDefinitions | StatusCode,
> = ContentType extends string
  ? ContentType extends `application/${infer Start}json${infer _End}`
    ? Start extends '' | `${string}+` | `vnd.${string}+`
      ? HandlerResponse<
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
      ? HandlerResponse<Content, ExtractStatusCode<Status>, 'text'>
      : Response
  : never;

/**
 * Converts a route config to the expected handler response type
 */
export type RouteConfigToHandlerResponse<R extends RouteConfig> =
  | {
      [Status in DefinedStatusCodes<R>]: undefined extends R['responses'][Status]['content']
        ? HandlerResponse<{}, ExtractStatusCode<Status>, string>
        : ReturnJsonOrTextOrResponse<
            keyof R['responses'][Status]['content'],
            ExtractContent<R['responses'][Status]['content']>,
            Status
          >;
    }[DefinedStatusCodes<R>]
  | ('default' extends keyof R['responses']
      ? undefined extends R['responses']['default']['content']
        ? HandlerResponse<
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

/**
 * Input type structure for route handlers
 */
export type Input = {
  /** Raw input */
  in?: {};
  /** Validated/parsed output */
  out?: {};
  /** Response format */
  outputFormat?: ResponseFormat;
};

/**
 * Validation targets for different parts of the request
 * @template FormValue - Type for form values
 */
export type ValidationTargets<
  FormValue = any,
  T extends FormValue = FormValue,
  P extends string = string,
> = {
  /** JSON body */
  json: any;
  /** Form data */
  form: Record<string, T | T[]>;
  /** Raw text body */
  text: string;
  /** Query parameters */
  query: Record<string, string | string[]>;
  /** Route parameters */
  params: Record<P, P extends `${infer _}?` ? string | undefined : string>;
  /** HTTP headers */
  headers: Record<string, string>;
  /** Cookies */
  cookies: Record<string, string>; // Cookies
};

/**
 * Request validation schema types
 */
export type RequestTypes = {
  body?: ZodRequestBody;
  params?: ZodType;
  query?: ZodType;
  cookies?: ZodType;
  headers?: ZodType | ZodType[];
};

/**
 * Type guard for JSON content types
 */
export type IsJson<T> = T extends string
  ? T extends `application/${infer Start}json${infer _End}`
    ? Start extends '' | `${string}+` | `vnd.${string}+`
      ? 'json'
      : never
    : never
  : never;

/**
 * Type guard for form content types
 */
export type IsForm<T> = T extends string
  ? T extends
      | `multipart/form-data${infer _Rest}`
      | `application/x-www-form-urlencoded${infer _Rest}`
    ? 'form'
    : never
  : never;

/**
 * Converts OpenAPI path format to framework-specific format
 * @example /users/{id} → /users/:id
 */
export type ConvertPathType<T extends string> =
  T extends `${infer Start}/{${infer Param}}${infer Rest}`
    ? `${Start}/:${Param}${ConvertPathType<Rest>}`
    : T;

/**
 * Extracts a specific part from a route configuration
 */
export type RequestPart<
  R extends RouteConfig,
  Part extends string,
> = Part extends keyof R['request'] ? R['request'][Part] : {};

/**
 * Type utility to check if a type includes undefined
 */
export type HasUndefined<T> = undefined extends T ? true : false;

/**
 * Base type for input validation
 */
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

/**
 * Type for JSON body input validation
 */
export type InputTypeJson<R extends RouteConfig> =
  R['request'] extends RequestTypes
    ? 'body' extends keyof R['request']
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
      : {}
    : {};

/**
 * Type for form data input validation
 */
export type InputTypeForm<R extends RouteConfig> =
  R['request'] extends RequestTypes
    ? 'body' extends keyof R['request']
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
      : {}
    : {};

/**
 * Type for route parameter validation
 */
export type InputTypeParam<R extends RouteConfig> = InputTypeBase<
  R,
  'params',
  'params'
>;

/**
 * Type for query parameter validation
 */
export type InputTypeQuery<R extends RouteConfig> = InputTypeBase<
  R,
  'query',
  'query'
>;

/**
 * Type for header validation
 */
export type InputTypeHeader<R extends RouteConfig> = InputTypeBase<
  R,
  'headers',
  'headers'
>;

/**
 * Type for cookie validation
 */
export type InputTypeCookie<R extends RouteConfig> = InputTypeBase<
  R,
  'cookies',
  'cookies'
>;

/**
 * Middleware handler type for request processing
 */
export type MiddlewareHandler<Req extends RequestLike, I extends Input = {}> = (
  c: Context<Req, I>,
) => MaybePromise<void>;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type OmitDistributive<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;

type HelperKey<Format extends ResponseFormat, Resp, DefaultData = any> =
  Extract<Resp, { format: Format }> extends infer R
    ? (response: Prettify<OmitDistributive<R, 'format'>>) => void
    : (response: { status: StatusCode; data: DefaultData }) => void;

export type Helper<
  R extends RouteConfig,
  Resp extends
    RouteConfigToHandlerResponse<R> = RouteConfigToHandlerResponse<R>,
> = {
  json: HelperKey<'json', Resp>;
  text: HelperKey<'text', Resp, string>;
};
