import { describe, it, expect } from 'vitest';
import { Request } from '@hapi/hapi';
import { HapiRequestAdapter } from '../src/request';

// Mock Hapi Request
const createMockRequest = (overrides: Partial<Request> = {}): Request => {
  return {
    payload: { test: 'data' },
    url: new URL('http://localhost/test/path'),
    method: 'get',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer token123',
    },
    query: {
      page: '1',
      limit: '10',
      tags: ['tag1', 'tag2'],
    },
    state: {
      sessionId: 'abc123',
      userId: 'user456',
    },
    params: {
      id: '123',
      slug: 'test-article',
    },
    ...overrides,
  } as unknown as Request;
};

describe('HapiRequestAdapter', () => {
  describe('constructor', () => {
    it('should create instance with Hapi request', () => {
      const mockReq = createMockRequest();
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter).toBeInstanceOf(HapiRequestAdapter);
    });
  });

  describe('body getter', () => {
    it('should return request body', () => {
      const mockReq = createMockRequest({
        payload: { title: 'Test Article', content: 'Article content' },
      });
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.body).toEqual(
        JSON.stringify({ title: 'Test Article', content: 'Article content' }),
      );
    });

    it('should return string body', () => {
      const mockReq = createMockRequest({ payload: 'raw string body' });
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.body).toBe('raw string body');
    });
  });

  describe('url getter', () => {
    it('should return request URL', () => {
      const mockReq = createMockRequest({
        url: new URL('http://localhost/api/articles/123'),
      });
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.url).toBe('/api/articles/123');
    });

    it('should return URL with query parameters', () => {
      const mockReq = createMockRequest({
        url: new URL('http://localhost/api/articles?page=1&limit=10'),
      });
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.url).toBe('/api/articles?page=1&limit=10');
    });
  });

  describe('method getter', () => {
    it('should return GET method', () => {
      const mockReq = createMockRequest({ method: 'get' });
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.method).toBe('get');
    });

    it('should return POST method', () => {
      const mockReq = createMockRequest({ method: 'post' });
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.method).toBe('post');
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
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.headers).toEqual(headers);
    });
  });

  describe('json getter', () => {
    it('should return parsed JSON body', () => {
      const jsonBody = { title: 'Test', content: 'Content' };
      const mockReq = createMockRequest({ payload: jsonBody });
      const adapter = new HapiRequestAdapter(mockReq);

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
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.query).toEqual(query);
    });
  });

  describe('params getter', () => {
    it('should return route parameters', () => {
      const params = {
        id: '123',
        slug: 'test-article',
      };
      const mockReq = createMockRequest({ params });
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.params).toEqual(params);
    });
  });

  describe('cookies getter', () => {
    it('should return request state as cookies', () => {
      const state = {
        sessionId: 'abc123',
        userId: 'user456',
        preferences: 'dark-mode',
      };
      const mockReq = createMockRequest({ state });
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.cookies).toEqual(state);
    });

    it('should return empty object for no state', () => {
      const mockReq = createMockRequest({ state: {} });
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.cookies).toEqual({});
    });
  });

  describe('form getter', () => {
    it('should return form data from payload', () => {
      const formData = {
        title: 'Test Article',
        content: 'Article content',
        tags: ['tag1', 'tag2'],
      };
      const mockReq = createMockRequest({ payload: formData });
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.form).toEqual(formData);
    });

    it('should return same value as json', () => {
      const mockReq = createMockRequest();
      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.form).toBe(adapter.json);
    });
  });

  describe('integration tests', () => {
    it('should handle complex request object', () => {
      const mockReq = createMockRequest({
        method: 'post',
        url: new URL('http://localhost/api/articles/123/comments?page=1'),
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token123',
        },
        payload: {
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
        state: {
          sessionId: 'session123',
        },
      });

      const adapter = new HapiRequestAdapter(mockReq);

      expect(adapter.method).toBe('post');
      expect(adapter.url).toBe('/api/articles/123/comments?page=1');
      expect(adapter.headers['content-type']).toBe('application/json');
      expect(adapter.json).toEqual({ comment: 'Great article!', rating: 5 });
      expect(adapter.query.page).toBe('1');
      expect(adapter.params.articleId).toBe('123');
      expect(adapter.cookies.sessionId).toBe('session123');
    });
  });
});
