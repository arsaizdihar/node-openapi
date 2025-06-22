import { FastifyRequest } from 'fastify';
import { RequestLike } from '@node-openapi/core';

export class FastifyRequestAdapter implements RequestLike {
  constructor(private readonly req: FastifyRequest) {}

  get url() {
    return this.req.url;
  }

  get method() {
    return this.req.method;
  }

  get headers() {
    return this.req.headers;
  }

  get query() {
    return this.req.query as Record<string, string>;
  }

  get params() {
    return this.req.params as Record<string, string>;
  }

  get cookies() {
    // Fastify has cookies in request.cookies when @fastify/cookie plugin is used
    return (this.req as any).cookies || {};
  }

  get form() {
    return this.req.body as Record<string, string>;
  }

  get json() {
    return this.req.body;
  }

  get body() {
    return this.req.body as string;
  }
}
