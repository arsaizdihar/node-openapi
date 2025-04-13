import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from './http.errors';

export const USER_ERRORS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_NOT_ACTIVE: 'USER_NOT_ACTIVE',
  USER_NOT_VERIFIED: 'USER_NOT_VERIFIED',
  USER_NOT_AUTHORIZED: 'USER_NOT_AUTHORIZED',
} as const;

export class InvalidCredentialsError extends UnauthorizedError {
  constructor(details?: Record<string, unknown>) {
    super('Invalid credentials', USER_ERRORS.INVALID_CREDENTIALS, details);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(details?: Record<string, unknown>) {
    super('User not found', USER_ERRORS.USER_NOT_FOUND, details);
  }
}

export class UserAlreadyExistsError extends BadRequestError {
  constructor(details?: Record<string, unknown>) {
    super('User already exists', USER_ERRORS.USER_ALREADY_EXISTS, details);
  }
}

export class UserNotActiveError extends BadRequestError {
  constructor(details?: Record<string, unknown>) {
    super('User is not active', USER_ERRORS.USER_NOT_ACTIVE, details);
  }
}
