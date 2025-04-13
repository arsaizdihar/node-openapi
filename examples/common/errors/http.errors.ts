export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export class NotFoundError extends HttpError {
  constructor(
    message: string,
    code: string = 'NOT_FOUND',
    details?: Record<string, unknown>,
  ) {
    super(404, message, code, details);
  }
}

export class BadRequestError extends HttpError {
  constructor(
    message: string,
    code: string = 'BAD_REQUEST',
    details?: Record<string, unknown>,
  ) {
    super(400, message, code, details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(
    message: string,
    code: string = 'UNAUTHORIZED',
    details?: Record<string, unknown>,
  ) {
    super(401, message, code, details);
  }
}

export class ForbiddenError extends HttpError {
  constructor(
    message: string,
    code: string = 'FORBIDDEN',
    details?: Record<string, unknown>,
  ) {
    super(403, message, code, details);
  }
}

export class InternalServerError extends HttpError {
  constructor(
    message: string,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: Record<string, unknown>,
  ) {
    super(500, message, code, details);
  }
}
