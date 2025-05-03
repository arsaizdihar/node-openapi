import { z } from '@node-openapi/core';
import { profileSchema } from './user.domain';

export const commentSchema = z
  .object({
    id: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    body: z.string(),
    author: profileSchema,
  })
  .openapi('Comment');

export type Comment = z.infer<typeof commentSchema>;

export const newCommentSchema = z
  .object({
    body: z.string(),
  })
  .openapi('NewComment');

export type NewComment = z.infer<typeof newCommentSchema>;
