import { FastifyRouteFactory } from '@node-openapi/fastify';
import {
  createRequiredAuthFactory,
  createOptionalAuthFactory,
} from '../factories';
import {
  createCommentRoute,
  deleteCommentRoute,
  getCommentsRoute,
} from '../routes/comments.routes';
import {
  createComment,
  deleteComment,
  getComments,
} from 'ws-common/service/comments.service';
export const commentsController = new FastifyRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getCommentsRoute, async ({ context, input }) => {
  const slug = input.param.slug;
  const comments = await getComments(slug, context.user ?? undefined);

  return { status: 200 as const, data: { comments } };
});

const authFactory = createRequiredAuthFactory();

authFactory.route(createCommentRoute, async ({ context, input }) => {
  const { slug } = input.param;
  const { comment } = input.json;
  const newComment = await createComment(slug, comment.body, context.user);

  return { status: 201 as const, data: { comment: newComment } };
});

authFactory.route(deleteCommentRoute, async ({ context, input }) => {
  const { slug, id } = input.param;
  const deletedComment = await deleteComment(slug, id, context.user);

  return { status: 200 as const, data: { comment: deletedComment } };
});

commentsController.router('', checkedAuthFactory);
commentsController.router('', authFactory);
