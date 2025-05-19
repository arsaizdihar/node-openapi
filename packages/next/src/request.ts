import { RequestLike } from '@node-openapi/core';
import { NextRequest } from 'next/server';

export class NextRequestAdapter extends RequestLike {
  private readonly _cookies: Record<string, string | string[] | undefined>;
  private readonly _headers: Record<string, string | string[] | undefined>;
  private readonly _query: Record<string, string | string[] | undefined>;

  constructor(
    private readonly req: NextRequest,
    readonly params: Record<string, string | string[] | undefined>,
  ) {
    super();

    this._cookies = new Proxy(
      {},
      {
        get: (_, prop) => {
          if (typeof prop === 'string') {
            return this.req.cookies.get(prop)?.value;
          }
          return undefined;
        },
      },
    );

    this._headers = new Proxy(
      {},
      {
        get: (_, prop) => {
          if (typeof prop === 'string') {
            return this.req.headers.get(prop);
          }
          return undefined;
        },
      },
    );

    this._query = new Proxy(
      {},
      {
        get: (_, prop) => {
          if (typeof prop === 'string') {
            const q = this.req.nextUrl.searchParams.getAll(prop);
            if (q.length === 0) {
              return undefined;
            }
            if (q.length === 1) {
              return q[0];
            }
            return q;
          }
          return undefined;
        },
      },
    );
  }

  get url() {
    return this.req.url;
  }

  get method() {
    return this.req.method;
  }

  get headers() {
    return this._headers;
  }

  get body() {
    return this.req.text();
  }

  get json() {
    return this.req.json();
  }

  get query() {
    return this._query;
  }

  get cookies() {
    return this._cookies;
  }
}
