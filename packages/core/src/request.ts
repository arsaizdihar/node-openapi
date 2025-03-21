import { MaybePromise } from './type';

export abstract class RequestLike<FormValueType = any> {
  abstract get url(): string;
  abstract get method(): string;
  abstract get headers(): Record<string, string | string[] | undefined>;
  abstract get body(): MaybePromise<string>;
  abstract get json(): MaybePromise<unknown>;
  get form(): MaybePromise<Record<string, FormValueType | undefined>> {
    return {};
  }
  abstract get query(): Record<string, string | string[] | undefined>;
  abstract get cookies(): Record<string, string | string[] | undefined>;
  abstract get params(): Record<string, string | string[] | undefined>;
}
