import { RequestLike } from '@node-openapi/core';
import { Request } from '@hapi/hapi';

export class HapiRequestAdapter extends RequestLike {
  constructor(private readonly request: Request) {
    super();
  }

  get url() {
    return this.request.url.toString();
  }

  get method() {
    return this.request.method;
  }

  get headers() {
    return this.request.headers;
  }

  get body() {
    if (typeof this.request.payload === 'string') {
      return this.request.payload;
    }

    return JSON.stringify(this.request.payload);
  }

  get json() {
    return this.request.payload;
  }

  get query() {
    return this.request.query;
  }

  get cookies() {
    return this.request.headers.cookie;
  }

  get params() {
    return this.request.params;
  }

  get form() {
    if (typeof this.request.payload === 'string') {
      throw new Error('Form data is not supported');
    }

    return this.request.payload;
  }
}
