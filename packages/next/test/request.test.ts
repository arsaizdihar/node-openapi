import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { NextRequestAdapter } from '../src/request';

// Mock Next.js Request with proper mocking approach
const createMockRequest = (
  options: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    nextUrl?: { searchParams: URLSearchParams };
    cookies?: any;
    json?: () => Promise<any>;
    formData?: () => Promise<FormData>;
    text?: () => Promise<string>;
  } = {},
): NextRequest => {
  const url = options.url || 'http://localhost/test/path';
  const method = options.method || 'GET';
  const headers = new Headers(
    options.headers || {
      'content-type': 'application/json',
      authorization: 'Bearer token123',
    },
  );

  const mockRequest = {
    url,
    method,
    headers,
    nextUrl: options.nextUrl || { searchParams: new URLSearchParams() },
    cookies: options.cookies || {
      get: () => undefined,
      getAll: () => [],
    },
    json: options.json || (() => Promise.resolve({})),
    formData: options.formData || (() => Promise.resolve(new FormData())),
    text: options.text || (() => Promise.resolve('')),
  } as any;

  return mockRequest;
};

describe('NextRequestAdapter', () => {
  describe('constructor', () => {
    it('should create instance with Next.js request', () => {
      const mockReq = createMockRequest();
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter).toBeInstanceOf(NextRequestAdapter);
    });
  });

  describe('url getter', () => {
    it('should return request URL', () => {
      const mockReq = createMockRequest({
        url: 'http://localhost/api/articles/123',
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.url).toBe('http://localhost/api/articles/123');
    });

    it('should return URL with query parameters', () => {
      const mockReq = createMockRequest({
        url: 'http://localhost/api/articles?page=1&limit=10',
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.url).toBe('http://localhost/api/articles?page=1&limit=10');
    });
  });

  describe('method getter', () => {
    it('should return GET method', () => {
      const mockReq = createMockRequest({ method: 'GET' });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.method).toBe('GET');
    });

    it('should return POST method', () => {
      const mockReq = createMockRequest({ method: 'POST' });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.method).toBe('POST');
    });

    it('should return PUT method', () => {
      const mockReq = createMockRequest({ method: 'PUT' });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.method).toBe('PUT');
    });

    it('should return DELETE method', () => {
      const mockReq = createMockRequest({ method: 'DELETE' });
      const adapter = new NextRequestAdapter(mockReq, {});

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
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.headers['content-type']).toEqual('application/json');
      expect(adapter.headers.authorization).toEqual('Bearer token123');
      expect(adapter.headers['x-custom-header']).toEqual('custom-value');
    });

    it('should return empty headers object when no headers', () => {
      const mockReq = createMockRequest({ headers: {} });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(Object.keys(adapter.headers)).toHaveLength(0);
    });

    it('should handle array header values', () => {
      const headers = {
        accept: 'application/json, text/plain',
      };
      const mockReq = createMockRequest({ headers });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.headers.accept).toContain('application/json');
    });
  });

  describe('json getter', async () => {
    it('should return parsed JSON body', async () => {
      const jsonBody = { title: 'Test', content: 'Content' };
      const mockReq = createMockRequest({
        json: () => Promise.resolve(jsonBody),
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(await adapter.json).toEqual(jsonBody);
    });

    it('should handle complex JSON objects', async () => {
      const complexJson = {
        title: 'Test Article',
        content: 'Article content',
        tags: ['tag1', 'tag2'],
        meta: {
          author: 'John Doe',
          publishedAt: '2024-01-01',
        },
      };
      const mockReq = createMockRequest({
        json: () => Promise.resolve(complexJson),
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(await adapter.json).toEqual(complexJson);
    });
  });

  describe('query getter', () => {
    it('should return query parameters', () => {
      const url = new URL(
        'http://localhost/test/path?page=1&limit=10&tags=tag1&tags=tag2',
      );
      const mockReq = createMockRequest({
        nextUrl: { searchParams: url.searchParams },
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.query.page).toEqual('1');
      expect(adapter.query.limit).toEqual('10');
      expect(adapter.query.tags).toEqual(['tag1', 'tag2']);
    });

    it('should handle single query parameters', () => {
      const url = new URL('http://localhost/test/path?search=test&sort=date');
      const mockReq = createMockRequest({
        nextUrl: { searchParams: url.searchParams },
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.query.search).toEqual('test');
      expect(adapter.query.sort).toEqual('date');
    });

    it('should return empty object for no query parameters', () => {
      const url = new URL('http://localhost/test/path');
      const mockReq = createMockRequest({
        nextUrl: { searchParams: url.searchParams },
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.query).toEqual({});
    });
  });

  describe('params getter', () => {
    it('should return route parameters', () => {
      const params = {
        id: '123',
        slug: 'test-article',
      };
      const adapter = new NextRequestAdapter(createMockRequest(), params);

      expect(adapter.params).toEqual(params);
    });

    it('should return empty object for no parameters', () => {
      const adapter = new NextRequestAdapter(createMockRequest(), {});

      expect(adapter.params).toEqual({});
    });

    it('should handle single parameter', () => {
      const params = { id: '456' };
      const adapter = new NextRequestAdapter(createMockRequest(), params);

      expect(adapter.params).toEqual(params);
    });
  });

  describe('cookies getter', () => {
    it('should return request cookies', () => {
      const mockReq = createMockRequest({
        cookies: {
          get: (name: string) => {
            const cookies: Record<string, { value: string }> = {
              sessionId: { value: 'abc123' },
              userId: { value: 'user456' },
              preferences: { value: 'dark-mode' },
            };
            return cookies[name];
          },
          getAll: () => [
            { name: 'sessionId', value: 'abc123' },
            { name: 'userId', value: 'user456' },
            { name: 'preferences', value: 'dark-mode' },
          ],
        },
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.cookies.sessionId).toEqual('abc123');
      expect(adapter.cookies.userId).toEqual('user456');
      expect(adapter.cookies.preferences).toEqual('dark-mode');
    });

    it('should return empty object for no cookies', () => {
      const mockReq = createMockRequest({
        cookies: {
          get: () => undefined,
          getAll: () => [],
        },
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.cookies).toEqual({});
    });

    it('should handle single cookie', () => {
      const mockReq = createMockRequest({
        cookies: {
          get: (name: string) => {
            if (name === 'sessionId') return { value: 'session123' };
            return undefined;
          },
          getAll: () => [{ name: 'sessionId', value: 'session123' }],
        },
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.cookies.sessionId).toEqual('session123');
    });
  });

  describe('form getter', () => {
    it('should return form data', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Article');
      formData.append('content', 'Article content');
      formData.append('tags', 'tag1');
      formData.append('tags', 'tag2');

      const mockReq = createMockRequest({
        formData: () => Promise.resolve(formData),
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      const result = await adapter.form;
      expect(result.title).toBe('Test Article');
      expect(result.content).toBe('Article content');
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });

    it('should handle empty form data', async () => {
      const formData = new FormData();
      const mockReq = createMockRequest({
        formData: () => Promise.resolve(formData),
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      const result = await adapter.form;
      expect(result).toEqual({});
    });

    it('should handle file uploads in form data', async () => {
      const formData = new FormData();
      const file = new File(['file content'], 'test.txt', {
        type: 'text/plain',
      });
      formData.append('file', file);
      formData.append('description', 'File description');

      const mockReq = createMockRequest({
        formData: () => Promise.resolve(formData),
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      const result = await adapter.form;
      expect(result.file).toBeInstanceOf(File);
      expect(result.description).toBe('File description');
    });
  });

  describe('body getter', () => {
    it('should return request body as text', async () => {
      const bodyText = 'raw string body';
      const mockReq = createMockRequest({
        text: () => Promise.resolve(bodyText),
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(await adapter.body).toBe(bodyText);
    });

    it('should handle empty body', async () => {
      const mockReq = createMockRequest({
        text: () => Promise.resolve(''),
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(await adapter.body).toBe('');
    });

    it('should handle JSON body as text', async () => {
      const jsonString = '{"message":"hello"}';
      const mockReq = createMockRequest({
        text: () => Promise.resolve(jsonString),
      });
      const adapter = new NextRequestAdapter(mockReq, {});

      expect(await adapter.body).toBe(jsonString);
    });
  });

  describe('integration tests', () => {
    it('should handle complex request object', async () => {
      const url = new URL(
        'http://localhost/api/articles/123/comments?page=1&include=author&include=replies',
      );
      const jsonBody = { comment: 'Great article!', rating: 5 };

      const mockReq = createMockRequest({
        method: 'POST',
        url: url.toString(),
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token123',
        },
        json: () => Promise.resolve(jsonBody),
        nextUrl: { searchParams: url.searchParams },
        cookies: {
          get: (name: string) => {
            if (name === 'sessionId') return { value: 'session123' };
            return undefined;
          },
          getAll: () => [{ name: 'sessionId', value: 'session123' }],
        },
      });

      const params = { articleId: '123' };
      const adapter = new NextRequestAdapter(mockReq, params);

      expect(adapter.method).toBe('POST');
      expect(adapter.url).toBe(url.toString());
      expect(adapter.headers['content-type']).toBe('application/json');
      expect(await adapter.json).toEqual(jsonBody);
      expect(adapter.query.page).toBe('1');
      expect(adapter.query.include).toEqual(['author', 'replies']);
      expect(adapter.params.articleId).toBe('123');
      expect(adapter.cookies.sessionId).toBe('session123');
    });

    it('should handle request with all empty/undefined values', () => {
      const url = new URL('http://localhost/test');
      const mockReq = createMockRequest({
        method: 'GET',
        url: url.toString(),
        headers: {},
        nextUrl: { searchParams: url.searchParams },
        cookies: {
          get: () => undefined,
          getAll: () => [],
        },
      });

      const adapter = new NextRequestAdapter(mockReq, {});

      expect(adapter.method).toBe('GET');
      expect(adapter.url).toBe(url.toString());
      expect(adapter.query).toEqual({});
      expect(adapter.params).toEqual({});
      expect(adapter.cookies).toEqual({});
    });
  });
});
