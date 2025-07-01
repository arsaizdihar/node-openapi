import { describe, it, expect } from 'vitest';
import { Context } from 'koa';
import { KoaRequestAdapter } from '../src/request';

// Mock Koa Request
const createMockRequest = (
  overrides: Partial<Context['request']> = {},
): Context['request'] => {
  return {
    body: { test: 'data' },
    url: '/test/path',
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer token123',
    },
    query: {
      page: '1',
      limit: '10',
      tags: ['tag1', 'tag2'],
    },
    rawBody: '',
    ...overrides,
  } as Context['request'];
};

describe('KoaRequestAdapter', () => {
  describe('constructor', () => {
    it('should create instance with Koa request', () => {
      const mockReq = createMockRequest();
      const adapter = new KoaRequestAdapter(mockReq);

      expect(adapter).toBeInstanceOf(KoaRequestAdapter);
    });
  });

  describe('body getter', () => {
    it('should return request rawBody', () => {
      const mockReq = createMockRequest({
        rawBody: 'raw string body',
      });
      const adapter = new KoaRequestAdapter(mockReq);

      expect(adapter.body).toBe('raw string body');
    });
  });

  describe('url getter', () => {
    it('should return request URL', () => {
      const mockReq = createMockRequest({ url: '/api/articles/123' });
      const adapter = new KoaRequestAdapter(mockReq);

      expect(adapter.url).toBe('/api/articles/123');
    });

    it('should return URL with query parameters', () => {
      const mockReq = createMockRequest({
        url: '/api/articles?page=1&limit=10',
      });
      const adapter = new KoaRequestAdapter(mockReq);

      expect(adapter.url).toBe('/api/articles?page=1&limit=10');
    });
  });

  describe('method getter', () => {
    it('should return GET method', () => {
      const mockReq = createMockRequest({ method: 'GET' });
      const adapter = new KoaRequestAdapter(mockReq);

      expect(adapter.method).toBe('GET');
    });

    it('should return POST method', () => {
      const mockReq = createMockRequest({ method: 'POST' });
      const adapter = new KoaRequestAdapter(mockReq);

      expect(adapter.method).toBe('POST');
    });
  });

  describe('headers getter', () => {
    it('should return request headers', () => {
      const headers = {
        'content-type': 'application/json',
        authorization: 'Bearer token123',
        'x-custom-header': 'custom-value',
      };
      const mockReq = createMockRequest({ headers });
      const adapter = new KoaRequestAdapter(mockReq);

      expect(adapter.headers).toEqual(headers);
    });
  });

  describe('json getter', () => {
    it('should return parsed JSON body', () => {
      const jsonBody = { title: 'Test', content: 'Content' };
      const mockReq = createMockRequest({ body: jsonBody });
      const adapter = new KoaRequestAdapter(mockReq);

      expect(adapter.json).toEqual(jsonBody);
    });
  });

  describe('query getter', () => {
    it('should return query parameters', () => {
      const query = {
        page: '1',
        limit: '10',
        search: 'test',
      };
      const mockReq = createMockRequest({ query });
      const adapter = new KoaRequestAdapter(mockReq);

      expect(adapter.query).toEqual(query);
    });
  });

  describe('params getter', () => {
    it('should return route parameters', () => {
      const params = {
        id: '123',
        slug: 'test-article',
      };
      const adapter = new KoaRequestAdapter(createMockRequest(), {}, params);

      expect(adapter.params).toEqual(params);
    });
  });
});
