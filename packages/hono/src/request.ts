import { MaybePromise, RequestLike } from '@node-openapi/core';
import { HonoRequest } from 'hono';

export class HonoRequestAdapter extends RequestLike {
  constructor(
    private readonly req: HonoRequest,
    public readonly cookies: Record<string, string | string[] | undefined> = {},
  ) {
    super();
  }

  get url() {
    return this.req.url;
  }

  get method() {
    return this.req.method;
  }

  get headers() {
    return this.req.header();
  }

  get body() {
    if (this.req.bodyCache.text) {
      return this.req.bodyCache.text;
    }

    return this.req.text();
  }

  get json() {
    if (this.req.bodyCache.json) {
      return this.req.bodyCache.json;
    }

    return this.req.json();
  }

  get query() {
    return this.req.query();
  }

  get form(): MaybePromise<Record<string, any>> {
    if (this.req.bodyCache.formData) {
      return this.req.bodyCache.formData;
    }

    return this.req.parseBody({});
  }

  get params(): Record<string, string | string[] | undefined> {
    return this.req.param();
  }
}
