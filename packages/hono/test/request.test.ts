import { describe, it, expect } from 'vitest';
import { HonoRequest } from 'hono';
import { HonoRequestAdapter } from '../src/request';

// Mock Hono Request
const createMockRequest = (
  overrides: Partial<HonoRequest> = {},
): HonoRequest => {
  const req = {
    url: '/test/path',
    method: 'GET',
    header: () => ({
      'content-type': 'application/json',
      authorization: 'Bearer token123',
    }),
    query: () => ({
      page: '1',
      limit: '10',
      tags: ['tag1', 'tag2'],
    }),
    param: () => ({
      id: '123',
      slug: 'test-article',
    }),
    json: () => Promise.resolve({ test: 'data' }),
    text: () => Promise.resolve('test data'),
    bodyCache: {},
    ...overrides,
  } as unknown as HonoRequest;

  return req;
};

describe('HonoRequestAdapter', () => {
  describe('getUrl', () => {
    it('should return the request URL', () => {
      const req = createMockRequest({ url: '/api/test' });
      const adapter = new HonoRequestAdapter(req);
      expect(adapter.url).toBe('/api/test');
    });
  });

  describe('getMethod', () => {
    it('should return the request method', () => {
      const req = createMockRequest({ method: 'POST' });
      const adapter = new HonoRequestAdapter(req);
      expect(adapter.method).toBe('POST');
    });
  });

  describe('getQuery', () => {
    it('should return query parameters', () => {
      const req = createMockRequest({
        query: () => ({ name: 'test', count: '5' }) as any,
      });
      const adapter = new HonoRequestAdapter(req);
      expect(adapter.query).toEqual({ name: 'test', count: '5' });
    });
  });

  describe('getHeaders', () => {
    it('should return headers', () => {
      const req = createMockRequest({
        header: () => ({ 'x-custom': 'value' }) as any,
      });
      const adapter = new HonoRequestAdapter(req);
      expect(adapter.headers).toEqual({ 'x-custom': 'value' });
    });
  });

  describe('getCookies', () => {
    it('should return cookies', () => {
      const req = createMockRequest();
      const adapter = new HonoRequestAdapter(req);
      // Hono doesn't have cookies in the standard way, should return empty object
      expect(adapter.cookies).toEqual({});
    });
  });

  describe('getParams', () => {
    it('should return route parameters', () => {
      const req = createMockRequest({
        param: () => ({ id: '456', type: 'test' }) as any,
      });
      const adapter = new HonoRequestAdapter(req);
      expect(adapter.params).toEqual({ id: '456', type: 'test' });
    });
  });

  describe('getBody', () => {
    it('should return the request body', async () => {
      const req = createMockRequest({ text: () => Promise.resolve('body') });
      const adapter = new HonoRequestAdapter(req);
      expect(await adapter.body).toBe('body');
    });
  });

  describe('getJson', () => {
    it('should return parsed JSON body', async () => {
      const jsonBody = { user: 'john' };
      const req = createMockRequest({
        json: () => Promise.resolve(jsonBody) as any,
      });
      const adapter = new HonoRequestAdapter(req);
      expect(await adapter.json).toEqual(jsonBody);
    });
  });
});
