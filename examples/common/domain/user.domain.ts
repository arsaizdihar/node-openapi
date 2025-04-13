import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { schema } from '../db';
import { userRoles } from '../db/schema';

export const userCreateSchema = createInsertSchema(schema.users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserCreateDTO = z.infer<typeof userCreateSchema>;

export const userSchema = createSelectSchema(schema.users)
  .omit({
    password: true,
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

export const registerSchema = userCreateSchema
  .omit({
    isActive: true,
  })
  .extend({
    password: z.string(),
  });

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
