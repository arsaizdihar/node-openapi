import { z } from '@node-openapi/core';

export const profileSchema = z
  .object({
    username: z.string(),
    bio: z.string(),
    image: z.string(),
    following: z.boolean(),
  })
  .openapi('Profile');

export type Profile = z.infer<typeof profileSchema>;

export const userSchema = z
  .object({
    id: z.number().int(),
    email: z.string().email(),
    token: z.string(),
    username: z.string(),
    bio: z.string(),
    image: z.string(),
  })
  .openapi('User');

export type User = z.infer<typeof userSchema>;

export const loginUserSchema = z
  .object({
    email: z.string().email(),
    password: z.string(),
  })
  .openapi('LoginUser');

export type LoginUser = z.infer<typeof loginUserSchema>;

export const registerUserSchema = z
  .object({
    username: z.string(),
    email: z.string().email(),
    password: z.string(),
  })
  .openapi('NewUser');

export type RegisterUser = z.infer<typeof registerUserSchema>;

export const tokenPayloadSchema = z.object({
  user: z.object({
    username: z.string(),
    email: z.string().email(),
  }),
});

export type TokenPayload = z.infer<typeof tokenPayloadSchema>;
