import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  CoreOpenAPIRouter,
  ResponseValidationError,
  RouteConfig,
} from '../src/index';
import { RequestLike } from '../src/request';
import { ResponseSender } from '../src/index';

// Mock request class for testing if needed, though not directly for these tests
class MockRequest implements RequestLike {
  url: string = '';
  method: string = 'GET';
  query: Record<string, any> = {};
  headers: Record<string, any> = {};
  cookies: Record<string, any> = {};
  params: Record<string, any> = {};
  json: any = null;
  form: Record<string, any> = {};
  body: any = null;
}

// A concrete implementation of CoreOpenAPIRouter to access protected static methods
class TestOpenAPIRouter extends CoreOpenAPIRouter<MockRequest> {
  doc<P extends string>(_path: P, _configure: any): void {
    // Mock implementation
  }

  public static publicValidateResponse<R>(
    config: RouteConfig,
    response: R,
    contentType: string,
    status: number,
  ) {
    // @ts-expect-error - Testing protected static method
    return this._validateResponse(config, response, contentType, status);
  }

  public static publicCreateHelper<R extends RouteConfig, SendReturn>(
    send: ResponseSender<SendReturn>,
    config?: R,
  ) {
    return this._createHelper(send, config);
  }
}

describe('CoreOpenAPIRouter Response Handling', () => {
  describe('_validateResponse', () => {
    const routeConfigWithSchema: RouteConfig = {
      method: 'get',
      path: '/test',
      responses: {
        200: {
          description: 'Success response',
          content: {
            'application/json': {
              schema: z.object({
                id: z.number(),
                name: z.string(),
              }),
            },
            'text/plain': {
              schema: z.string().min(1),
            },
          },
        },
      },
    };

    it('should return original response if no schema defined for status/contentType', () => {
      const response = { message: 'No schema here' };
      const validated = TestOpenAPIRouter.publicValidateResponse(
        routeConfigWithSchema,
        response,
        'application/json',
        404, // Status not defined in schema
      );
      expect(validated).toEqual(response);

      const validated2 = TestOpenAPIRouter.publicValidateResponse(
        routeConfigWithSchema,
        response,
        'application/xml', // ContentType not defined
        200,
      );
      expect(validated2).toEqual(response);
    });

    it('should return original response if schema is not a ZodType', () => {
      const configWithNonZodSchema: RouteConfig = {
        method: 'get',
        path: '/test',
        responses: {
          200: {
            description: 'Success response',
            content: {
              'application/json': {
                schema: {}, // Not a Zod schema
              },
            },
          },
        },
      };
      const response = { id: 1, name: 'Test' };
      const validated = TestOpenAPIRouter.publicValidateResponse(
        configWithNonZodSchema,
        response,
        'application/json',
        200,
      );
      expect(validated).toEqual(response);
    });

    it('should validate and return data for valid JSON response', () => {
      const response = { id: 1, name: 'Test Item' };
      const validated = TestOpenAPIRouter.publicValidateResponse(
        routeConfigWithSchema,
        response,
        'application/json',
        200,
      );
      expect(validated).toEqual(response);
    });

    it('should throw ResponseValidationError for invalid JSON response', () => {
      const invalidResponse = { id: 'not-a-number', name: 'Test Item' };
      expect(() =>
        TestOpenAPIRouter.publicValidateResponse(
          routeConfigWithSchema,
          invalidResponse,
          'application/json',
          200,
        ),
      ).toThrow(ResponseValidationError);
    });

    it('should validate and return data for valid text response', () => {
      const response = 'This is a valid text';
      const validated = TestOpenAPIRouter.publicValidateResponse(
        routeConfigWithSchema,
        response,
        'text/plain',
        200,
      );
      expect(validated).toEqual(response);
    });

    it('should throw ResponseValidationError for invalid text response', () => {
      const invalidResponse = ''; // Empty string, schema expects min(1)
      expect(() =>
        TestOpenAPIRouter.publicValidateResponse(
          routeConfigWithSchema,
          invalidResponse,
          'text/plain',
          200,
        ),
      ).toThrow(ResponseValidationError);
    });

    it('should return original response if config.responses is undefined', () => {
      const configWithoutResponses: RouteConfig = {
        method: 'get',
        path: '/test',
        responses: undefined as any, // Adjusted type assertion
      };
      const response = { data: 'test' };
      const validated = TestOpenAPIRouter.publicValidateResponse(
        configWithoutResponses,
        response,
        'application/json',
        200,
      );
      expect(validated).toBe(response);
    });

    it('should return original response if responseByStatus.content is undefined', () => {
      const configWithoutContent: RouteConfig = {
        method: 'get',
        path: '/test',
        responses: {
          200: {
            description: 'no content',
          } as any, // Cast to bypass type check for testing
        },
      };
      const response = { data: 'test' };
      const validated = TestOpenAPIRouter.publicValidateResponse(
        configWithoutContent,
        response,
        'application/json',
        200,
      );
      expect(validated).toBe(response);
    });

    it('should return original response if responseByStatus.content[contentType] is undefined', () => {
      const configWithoutContentType: RouteConfig = {
        method: 'get',
        path: '/test',
        responses: {
          200: {
            description: 'no content type',
            content: {}, // Empty content
          },
        },
      };
      const response = { data: 'test' };
      const validated = TestOpenAPIRouter.publicValidateResponse(
        configWithoutContentType,
        response,
        'application/json',
        200,
      );
      expect(validated).toBe(response);
    });
  });

  describe('_createHelper', () => {
    const mockSend: ResponseSender<string> = {
      json: vi.fn(
        (data, status) => `json: ${JSON.stringify(data)}, status: ${status}`,
      ),
      text: vi.fn((data, status) => `text: ${data}, status: ${status}`),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    const routeConfig: RouteConfig = {
      method: 'get',
      path: '/test',
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: z.object({ message: z.string() }),
            },
            'text/plain': {
              schema: z.string().min(5),
            },
          },
        },
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: z.object({ id: z.number() }),
            },
          },
        },
      },
    };

    it('should create a helper that sends JSON response without validation if no config', () => {
      const helper = TestOpenAPIRouter.publicCreateHelper(mockSend);
      const data = { info: 'test' };
      helper.json({ data, status: 200 });
      expect(mockSend.json).toHaveBeenCalledWith(data, 200);
      helper.json({ data }); // test default status
      expect(mockSend.json).toHaveBeenCalledWith(data, 200);
    });

    it('should create a helper that sends text response without validation if no config', () => {
      const helper = TestOpenAPIRouter.publicCreateHelper(mockSend);
      const data = 'hello world';
      helper.text({ data, status: 200 });
      expect(mockSend.text).toHaveBeenCalledWith(data, 200);
    });

    it('should validate and send JSON response using helper', () => {
      const helper = TestOpenAPIRouter.publicCreateHelper(
        mockSend,
        routeConfig,
      );
      const validData = { message: 'Validated' };
      helper.json({ data: validData, status: 200 });
      expect(mockSend.json).toHaveBeenCalledWith(validData, 200);

      const validData201 = { id: 123 };
      helper.json({ data: validData201, status: 201 });
      expect(mockSend.json).toHaveBeenCalledWith(validData201, 201);
    });

    it('should throw ResponseValidationError for invalid JSON via helper', () => {
      const helper = TestOpenAPIRouter.publicCreateHelper(
        mockSend,
        routeConfig,
      );
      const invalidData = { message: 123 }; // Should be string
      expect(() => helper.json({ data: invalidData, status: 200 })).toThrow(
        ResponseValidationError,
      );
      expect(mockSend.json).not.toHaveBeenCalled();
    });

    it('should validate and send text response using helper', () => {
      const helper = TestOpenAPIRouter.publicCreateHelper(
        mockSend,
        routeConfig,
      );
      const validData = 'This is a valid text response';
      helper.text({ data: validData, status: 200 });
      expect(mockSend.text).toHaveBeenCalledWith(validData, 200);
    });

    it('should throw ResponseValidationError for invalid text via helper', () => {
      const helper = TestOpenAPIRouter.publicCreateHelper(
        mockSend,
        routeConfig,
      );
      const invalidData = 'one'; // Schema expects min(5)
      expect(() => helper.text({ data: invalidData, status: 200 })).toThrow(
        ResponseValidationError,
      );
      expect(mockSend.text).not.toHaveBeenCalled();
    });

    it('helper.json should use default status 200 if not provided', () => {
      const helper = TestOpenAPIRouter.publicCreateHelper(
        mockSend,
        routeConfig,
      );
      const data = { message: 'Default status test' };
      helper.json({ data });
      expect(mockSend.json).toHaveBeenCalledWith(data, 200);
    });
  });

  describe('ResponseValidationError', () => {
    it('should be an instance of Error', () => {
      const zodError = new z.ZodError([]);
      const error = new ResponseValidationError(zodError);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ResponseValidationError);
    });

    it('should contain the original ZodError', () => {
      const zodIssues = [
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string' as const,
          received: 'number' as const,
          path: ['name'],
          message: 'Expected string, received number',
        },
      ]; // Corrected ZodIssue
      const zodError = new z.ZodError(zodIssues);
      const error = new ResponseValidationError(zodError);
      expect(error.zodError).toBe(zodError);
      expect(error.message).toBe('Response validation failed');
      expect(error.cause).toBe(zodError);
    });
  });
});
