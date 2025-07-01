import { describe, it, expect } from 'vitest';
import { FastifyRequest } from 'fastify';
import { FastifyRequestAdapter } from '../src/request';

// Mock Fastify Request
const createMockRequest = (
  overrides: Partial<FastifyRequest> = {},
): FastifyRequest => {
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
    params: {
      id: '123',
      slug: 'test-article',
    },
    ...overrides,
  } as FastifyRequest;
};

describe('FastifyRequestAdapter', () => {
  describe('constructor', () => {
    it('should create instance with Fastify request', () => {
      const mockReq = createMockRequest();
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter).toBeInstanceOf(FastifyRequestAdapter);
    });
  });

  describe('body getter', () => {
    it('should return request body', () => {
      const mockReq = createMockRequest({
        body: { title: 'Test Article', content: 'Article content' },
      });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.body).toEqual({
        title: 'Test Article',
        content: 'Article content',
      });
    });

    it('should return empty body when no body is present', () => {
      const mockReq = createMockRequest({ body: undefined });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.body).toBeUndefined();
    });

    it('should return string body', () => {
      const mockReq = createMockRequest({ body: 'raw string body' });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.body).toBe('raw string body');
    });
  });

  describe('url getter', () => {
    it('should return request URL', () => {
      const mockReq = createMockRequest({ url: '/api/articles/123' });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.url).toBe('/api/articles/123');
    });

    it('should return URL with query parameters', () => {
      const mockReq = createMockRequest({
        url: '/api/articles?page=1&limit=10',
      });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.url).toBe('/api/articles?page=1&limit=10');
    });
  });

  describe('method getter', () => {
    it('should return GET method', () => {
      const mockReq = createMockRequest({ method: 'GET' });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.method).toBe('GET');
    });

    it('should return POST method', () => {
      const mockReq = createMockRequest({ method: 'POST' });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.method).toBe('POST');
    });

    it('should return PUT method', () => {
      const mockReq = createMockRequest({ method: 'PUT' });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.method).toBe('PUT');
    });

    it('should return DELETE method', () => {
      const mockReq = createMockRequest({ method: 'DELETE' });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.method).toBe('DELETE');
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
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.headers).toEqual(headers);
    });

    it('should return empty headers object', () => {
      const mockReq = createMockRequest({ headers: {} });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.headers).toEqual({});
    });

    it('should handle array header values', () => {
      const headers = {
        accept: 'application/json, text/plain',
      };
      const mockReq = createMockRequest({ headers });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.headers).toEqual(headers);
    });
  });

  describe('json getter', () => {
    it('should return parsed JSON body', () => {
      const jsonBody = { title: 'Test', content: 'Content' };
      const mockReq = createMockRequest({ body: jsonBody });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.json).toEqual(jsonBody);
    });

    it('should return same value as body', () => {
      const mockReq = createMockRequest();
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.json).toBe(adapter.body);
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
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.query).toEqual(query);
    });

    it('should handle array query parameters', () => {
      const query = {
        tags: ['tag1', 'tag2', 'tag3'],
        sort: 'createdAt',
      };
      const mockReq = createMockRequest({ query });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.query).toEqual(query);
    });

    it('should return empty object for no query parameters', () => {
      const mockReq = createMockRequest({ query: {} });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.query).toEqual({});
    });

    it('should handle undefined query values', () => {
      const query = {
        page: '1',
        limit: undefined,
        search: 'test',
      };
      const mockReq = createMockRequest({ query });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.query).toEqual(query);
    });
  });

  describe('cookies getter', () => {
    it('should return request cookies', () => {
      const cookies = {
        sessionId: 'abc123',
        userId: 'user456',
        preferences: 'dark-mode',
      };
      const mockReq = createMockRequest();
      // Mock the cookies property that doesn't exist on standard FastifyRequest
      (mockReq as any).cookies = cookies;
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.cookies).toEqual(cookies);
    });

    it('should return empty object for no cookies', () => {
      const mockReq = createMockRequest();
      // Mock the cookies property that doesn't exist on standard FastifyRequest
      (mockReq as any).cookies = {};
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.cookies).toEqual({});
    });

    it('should handle undefined cookies', () => {
      const mockReq = createMockRequest();
      // Mock the cookies property that doesn't exist on standard FastifyRequest
      (mockReq as any).cookies = undefined;
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.cookies).toEqual({});
    });
  });

  describe('params getter', () => {
    it('should return route parameters', () => {
      const params = {
        id: '123',
        slug: 'test-article',
      };
      const mockReq = createMockRequest({ params });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.params).toEqual(params);
    });

    it('should return empty object for no parameters', () => {
      const mockReq = createMockRequest({ params: {} });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.params).toEqual({});
    });

    it('should cast params to Record<string, string>', () => {
      const params = {
        id: '123', // Fastify params are strings
        slug: 'test-article',
      };
      const mockReq = createMockRequest({ params });
      const adapter = new FastifyRequestAdapter(mockReq);

      // The result should be cast to Record<string, string>
      expect(adapter.params).toEqual(params);
    });
  });

  describe('form getter', () => {
    it('should return form data from body', () => {
      const formData = {
        title: 'Test Article',
        content: 'Article content',
        tags: ['tag1', 'tag2'],
      };
      const mockReq = createMockRequest({ body: formData });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.form).toEqual(formData);
    });

    it('should return same value as body', () => {
      const mockReq = createMockRequest();
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.form).toBe(adapter.body);
    });

    it('should handle multipart form data', () => {
      const formData = {
        file: 'file-content',
        description: 'File description',
      };
      const mockReq = createMockRequest({ body: formData });
      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.form).toEqual(formData);
    });
  });

  describe('integration tests', () => {
    it('should handle complex request object', () => {
      const mockReq = createMockRequest({
        method: 'POST',
        url: '/api/articles/123/comments?page=1',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token123',
        },
        body: {
          comment: 'Great article!',
          rating: 5,
        },
        query: {
          page: '1',
          include: ['author', 'replies'],
        },
        params: {
          articleId: '123',
        },
      });

      // Mock the cookies property separately
      (mockReq as any).cookies = {
        sessionId: 'session123',
      };

      const adapter = new FastifyRequestAdapter(mockReq);

      expect(adapter.method).toBe('POST');
      expect(adapter.url).toBe('/api/articles/123/comments?page=1');
      expect(adapter.headers['content-type']).toBe('application/json');
      expect(adapter.body).toEqual({ comment: 'Great article!', rating: 5 });
      expect(adapter.query.page).toBe('1');
      expect(adapter.params.articleId).toBe('123');
      expect(adapter.cookies.sessionId).toBe('session123');
    });
  });
});
