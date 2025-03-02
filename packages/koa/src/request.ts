import '@koa/bodyparser';
import { RequestLike } from '@node-openapi/core';
import { Context } from 'koa';

export class KoaRequestAdapter extends RequestLike {
  constructor(private readonly req: Context['request']) {
    super();
  }

  get body() {
    return this.req.rawBody;
  }

  get url() {
    return this.req.url;
  }

  get method() {
    return this.req.method;
  }

  get headers() {
    return this.req.headers;
  }

  get json() {
    return this.req.body;
  }

  get query() {
    return this.req.query;
  }
}
