import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { schema } from '../db';
import { userRoles } from '../db/schema';
import { storeCreateSchema } from './store.domain';

export const userCreateSchema = createInsertSchema(schema.users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export const userCreateSellerSchema = userCreateSchema.extend({
  role: z.literal('seller'),
  store: storeCreateSchema,
});

export const userCreateCustomerSchema = userCreateSchema.extend({
  role: z.literal('customer'),
});

export type UserCreateDTO = z.infer<typeof userCreateSchema>;
export type UserCreateSellerDTO = z.infer<typeof userCreateSellerSchema>;
export type UserCreateCustomerDTO = z.infer<typeof userCreateCustomerSchema>;

export const userSchema = createSelectSchema(schema.users)
  .omit({
    password: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('User');

export type UserDTO = z.infer<typeof userSchema>;

export type UserEntity = typeof schema.users.$inferSelect;

export type UserRole = UserEntity['role'];

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

export const userListParamsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(50).optional().default(10),
  search: z
    .string()
    .optional()
    .openapi({ description: 'Search by name or email' }),
  role: z.enum(userRoles).optional(),
  isActive: z.boolean().optional(),
});

export type UserListParams = z.infer<typeof userListParamsSchema>;

export const userListResponseSchema = z.object({
  users: z.array(userSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type UserListResponse = z.infer<typeof userListResponseSchema>;

export function userEntityToDTO(user: UserEntity): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
