import { createRequiredAuthFactory } from '@/app/api/factories';
import { defaultRouteSecurity } from '@/app/api/security';
import { createRoute, z } from '@node-openapi/next';
import { NextResponse } from 'next/server';
import { deleteComment } from 'ws-common/service/comments.service';

export const articleCommentIdController = createRequiredAuthFactory();

const deleteCommentRoute = createRoute({
  tags: ['comments'],
  method: 'delete',
  path: '/articles/{slug}/comments/{id}',
  description: 'Delete a comment',
  summary: 'Delete a comment',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
      id: z.coerce.number().int(),
    }),
  },
  responses: {
    200: {
      description: 'Comment deleted',
    },
  },
});

articleCommentIdController.handler(deleteCommentRoute, async (req, ctx) => {
  const slug = ctx.input.param.slug;
  const id = ctx.input.param.id;
  await deleteComment(slug, id, ctx.user);
  return NextResponse.json({});
});

export const { DELETE } = articleCommentIdController.handlers;
