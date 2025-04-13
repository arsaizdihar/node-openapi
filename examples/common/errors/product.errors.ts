import { NotFoundError } from './http.errors';

export const PRODUCT_ERRORS = {
  NOT_FOUND: 'PRODUCT_NOT_FOUND',
} as const;

export class ProductNotFoundError extends NotFoundError {
  constructor() {
    super('Product not found', PRODUCT_ERRORS.NOT_FOUND);
  }
}
