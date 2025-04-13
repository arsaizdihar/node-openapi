import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { schema } from '../db';

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
