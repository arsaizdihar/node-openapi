import { HapiRouteFactory } from '@node-openapi/hapi';
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

export const commentsController = new HapiRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getCommentsRoute, async ({ h, input, context }) => {
  const comments = await getComments(input.param.slug, context.user);
  return h.json({ status: 200, data: { comments } });
});

const authFactory = createRequiredAuthFactory();

authFactory.route(createCommentRoute, async ({ h, input, context }) => {
  const newComment = await createComment(
    input.param.slug,
    input.json.comment.body,
    context.user,
  );
  return h.json({ status: 201, data: { comment: newComment } });
});

authFactory.route(deleteCommentRoute, async ({ h, input, context }) => {
  await deleteComment(input.param.slug, input.param.id, context.user);
  return h.response().code(200);
});

commentsController.router('', checkedAuthFactory);
commentsController.router('', authFactory);
