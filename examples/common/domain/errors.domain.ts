import { z } from 'zod';
import { USER_ERRORS } from '../errors/user.errors';
import { PRODUCT_ERRORS } from '../errors/product.errors';
import { HTTP_ERRORS } from '../errors/http.errors';

export const errorSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    code: z.nativeEnum({
      ...USER_ERRORS,
      ...PRODUCT_ERRORS,
      ...HTTP_ERRORS,
    }),
    details: z.record(z.string(), z.any()).optional(),
  })
  .openapi('Error');

export type ErrorSchema = z.infer<typeof errorSchema>;
