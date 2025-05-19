import {
  createOptionalAuthFactory,
  createRequiredAuthFactory,
} from '@/app/api/factories';
import { defaultRouteSecurity } from '@/app/api/security';
import { createRoute, NextRouteFactory, z } from '@node-openapi/next';
import { NextResponse } from 'next/server';
import {
  commentSchema,
  newCommentSchema,
} from 'ws-common/domain/comment.domain';
import { getComments, createComment } from 'ws-common/service/comments.service';
import { articleCommentIdController } from './[id]/route';

export const articleCommentsController = new NextRouteFactory();
const optionalAuthFactory = createOptionalAuthFactory();
const requiredAuthFactory = createRequiredAuthFactory();

const getCommentsRoute = createRoute({
  tags: ['comments'],
  method: 'get',
  path: '/articles/{slug}/comments',
  description: 'Get comments',
  summary: 'Get comments',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Comments',
      content: {
        'application/json': {
          schema: z.object({
            comments: z.array(commentSchema),
          }),
        },
      },
    },
  },
});

const createCommentRoute = createRoute({
  tags: ['comments'],
  method: 'post',
  path: '/articles/{slug}/comments',
  description: 'Create a comment',
  summary: 'Create a comment',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            comment: newCommentSchema,
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Comment created',
      content: {
        'application/json': {
          schema: z.object({
            comment: commentSchema,
          }),
        },
      },
    },
  },
});

optionalAuthFactory.handler(getCommentsRoute, async (req, ctx) => {
  const slug = ctx.input.param.slug;
  const comments = await getComments(slug, ctx.user ?? undefined);
  return NextResponse.json({ comments });
});

requiredAuthFactory.handler(createCommentRoute, async (req, ctx) => {
  const slug = ctx.input.param.slug;
  const comment = ctx.input.json.comment;
  const newComment = await createComment(slug, comment.body, ctx.user);
  return NextResponse.json({ comment: newComment });
});

export const { GET, POST } = articleCommentsController
  .merge(optionalAuthFactory)
  .merge(requiredAuthFactory)
  .router(articleCommentIdController).handlers;
