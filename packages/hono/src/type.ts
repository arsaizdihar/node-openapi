import {
  HandlerResponse,
  HelperResponseArg,
  Input,
  MaybePromise,
  RouteConfig,
  RouteConfigToHandlerResponse,
  StatusCodeOr200,
} from '@node-openapi/core';
import { BlankInput, Next, TypedResponse } from 'hono/types';
import { Context, Env } from 'hono';
import { BlankEnv } from 'hono/types';

type PrefixKeys<T extends object> = {
  [K in keyof T as `_${string & K}`]: T[K];
};

type HandlerResponseToTypedResponse<R extends HandlerResponse> = PrefixKeys<R>;

export type RouteConfigToTypedResponse<R extends RouteConfig> =
  RouteConfigToHandlerResponse<R> extends HandlerResponse
    ? HandlerResponseToTypedResponse<RouteConfigToHandlerResponse<R>>
    : never;

type WithTypedResponse<
  R extends RouteConfig,
  E extends Env = BlankEnv,
  P extends string = any,
  I extends Input = BlankInput,
> = Context<E, P, I> & {
  typedJson: <Response extends HelperResponseArg<R, 'json'>>(
    response: Response,
  ) => TypedResponse<Response['data'], StatusCodeOr200<Response>, 'json'>;
  typedText: <Response extends HelperResponseArg<R, 'text', string>>(
    response: Response,
  ) => TypedResponse<Response['data'], StatusCodeOr200<Response>, 'text'>;
};

export type HandlerWithTypedResponse<
  R extends RouteConfig,
  E extends Env = any,
  P extends string = any,
  I extends Input = BlankInput,
  Resp = any,
> = (c: WithTypedResponse<R, E, P, I>, next: Next) => MaybePromise<Resp>;
