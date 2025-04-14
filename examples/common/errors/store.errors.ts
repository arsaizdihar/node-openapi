import { NotFoundError } from './http.errors';

export const STORE_ERRORS = {
  NOT_FOUND: 'STORE_NOT_FOUND',
} as const;

export class StoreNotFoundError extends NotFoundError {
  constructor() {
    super('Store not found', STORE_ERRORS.NOT_FOUND);
  }
}
