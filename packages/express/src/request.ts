import { Request as ExpressRequest } from 'express';
import { MaybePromise, RequestLike } from '@node-openapi/core';

export class ExpressRequestAdapter extends RequestLike<File> {
  constructor(private readonly req: ExpressRequest) {
    super();
  }

  get body(): MaybePromise<string> {
    return this.req.body;
  }

  get url(): string {
    return this.req.url;
  }

  get method(): string {
    return this.req.method;
  }

  get headers() {
    return this.req.headers;
  }

  get json(): MaybePromise<unknown> {
    return this.req.body;
  }

  get query() {
    return this.req.query as Record<string, string | string[] | undefined>;
  }

  get cookies() {
    return this.req.cookies;
  }

  get params() {
    return this.req.params as Record<string, string>;
  }

  get form() {
    return this.req.body;
  }
}
