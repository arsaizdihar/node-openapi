import { z } from 'zod';
import { storeCreateSchema } from './store.domain';
import { userCreateSchema } from './user.domain';

export const userCreateSellerSchema = userCreateSchema.extend({
  role: z.literal('seller'),
  store: storeCreateSchema,
});

export const userCreateCustomerSchema = userCreateSchema.extend({
  role: z.literal('customer'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const registerSchema = z.discriminatedUnion('role', [
  userCreateCustomerSchema,
  userCreateSellerSchema,
]);

export type RegisterDTO = z.infer<typeof registerSchema>;
