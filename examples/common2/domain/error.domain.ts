import { z } from '@node-openapi/core';

export const genericErrorSchema = z
  .object({
    errors: z.object({
      body: z.array(z.string()),
    }),
  })
  .openapi('GenericErrorModel');

export type GenericErrorModel = z.infer<typeof genericErrorSchema>;
