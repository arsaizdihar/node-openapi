import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { schema } from '../db';
import { userRoles } from '../db/schema';

export const userCreateSchema = createInsertSchema(schema.users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export type UserCreateDTO = z.infer<typeof userCreateSchema>;

export const userSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(userRoles),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('User');

export type UserDTO = z.infer<typeof userSchema>;

export type UserEntity = typeof schema.users.$inferSelect;

export type UserRole = UserEntity['role'];

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
