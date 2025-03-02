import { MaybePromise } from './type';

export abstract class RequestLike {
  abstract get url(): string;
  abstract get method(): string;
  abstract get headers(): Record<string, string | string[] | undefined>;
  abstract get body(): MaybePromise<string>;
  abstract get json(): MaybePromise<unknown>;
  abstract get query(): Record<string, string | string[] | undefined>;
}
