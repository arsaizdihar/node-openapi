import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { CoreOpenApiRouter } from '../src/index';
import { RequestLike } from '../src/request';
import { ValidationTargets } from '../dist';

// Mock request class for testing
class MockRequest implements RequestLike {
  url: string;
  method: string;
  query: Record<string, any>;
  headers: Record<string, any>;
  cookies: Record<string, any>;
  params: Record<string, any>;
  json: any;
  form: Record<string, any>;
  body: any;

  constructor() {
    this.url = '';
    this.method = 'GET';
    this.query = {};
    this.headers = {};
    this.cookies = {};
    this.params = {};
    this.json = null;
    this.form = {};
    this.body = null;
  }
}

// Testing implementation of CoreOpenAPIRouter
class TestOpenAPIRouter extends CoreOpenApiRouter<MockRequest> {
  doc<P extends string>(_path: P, _configure: any): void {
    // Mock implementation
  }

  // Expose protected method for testing
  validate<T extends z.ZodSchema>(target: keyof ValidationTargets, schema: T) {
    return this.zValidator(target, schema);
  }
}

describe('CoreOpenAPIRouter Validation', () => {
  describe('zValidator', () => {
    it('should validate query parameters', async () => {
      const router = new TestOpenAPIRouter();
      const querySchema = z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
      });

      const validator = router.validate('query', querySchema);
      const mockReq = new MockRequest();
      mockReq.query = { page: '1', limit: '10' };

      const context: any = { req: mockReq, input: {} };
      await validator(context);

      expect(context.input).toHaveProperty('query');
      expect(context.input.query).toEqual({ page: '1', limit: '10' });
    });

    it('should validate JSON body', async () => {
      const router = new TestOpenAPIRouter();
      const bodySchema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      const validator = router.validate('json', bodySchema);
      const mockReq = new MockRequest();
      mockReq.headers['content-type'] = 'application/json';
      mockReq.json = { name: 'John Doe', email: 'john@example.com' };

      const context: any = { req: mockReq, input: {} };
      await validator(context);

      expect(context.input).toHaveProperty('json');
      expect(context.input.json).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should validate form data', async () => {
      const router = new TestOpenAPIRouter();
      const formSchema = z.object({
        username: z.string(),
        password: z.string(),
      });

      const validator = router.validate('form', formSchema);
      const mockReq = new MockRequest();
      mockReq.headers['content-type'] = 'multipart/form-data';
      mockReq.form = { username: 'johndoe', password: 'secret123' };

      const context: any = { req: mockReq, input: {} };
      await validator(context);

      expect(context.input).toHaveProperty('form');
      expect(context.input.form).toEqual({
        username: 'johndoe',
        password: 'secret123',
      });
    });

    it('should validate request headers', async () => {
      const router = new TestOpenAPIRouter();
      const headerSchema = z.object({
        'api-key': z.string(),
      });

      const validator = router.validate('header', headerSchema);
      const mockReq = new MockRequest();
      mockReq.headers = { 'api-key': 'abc123' };

      const context: any = { req: mockReq, input: {} };
      await validator(context);

      expect(context.input).toHaveProperty('header');
      expect(context.input.header).toEqual({ 'api-key': 'abc123' });
    });

    it('should validate URL parameters', async () => {
      const router = new TestOpenAPIRouter();
      const paramSchema = z.object({
        id: z.string(),
      });

      const validator = router.validate('param', paramSchema);
      const mockReq = new MockRequest();
      mockReq.params = { id: '123' };

      const context: any = { req: mockReq, input: {} };
      await validator(context);

      expect(context.input).toHaveProperty('param');
      expect(context.input.param).toEqual({ id: '123' });
    });

    it('should throw an error for invalid data', async () => {
      const router = new TestOpenAPIRouter();
      const schema = z.object({
        email: z.string().email(),
      });

      const validator = router.validate('json', schema);
      const mockReq = new MockRequest();
      mockReq.headers['content-type'] = 'application/json';
      mockReq.json = { email: 'not-an-email' };

      const context: any = { req: mockReq, input: {} };

      await expect(async () => {
        await validator(context);
      }).rejects.toThrow();
    });
  });
});
