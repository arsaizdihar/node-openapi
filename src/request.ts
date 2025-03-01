import { MaybePromise } from './utils/type';

export abstract class Request {
  abstract get url(): string;
  abstract get method(): string;
  abstract get headers(): Record<string, string>;
  abstract get body(): MaybePromise<string>;
  abstract get json(): MaybePromise<unknown>;
  abstract get query(): Record<string, string>;
}
