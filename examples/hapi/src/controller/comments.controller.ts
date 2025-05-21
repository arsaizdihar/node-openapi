import { OpenAPIRouter } from '@node-openapi/hapi';
import {
  createRequiredAuthRouter,
  createOptionalAuthRouter,
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

export const commentsRouter = new OpenAPIRouter();

const checkedAuthRouter = createOptionalAuthRouter();

checkedAuthRouter.route(getCommentsRoute, async ({ h, input, context }) => {
  const comments = await getComments(input.param.slug, context.user);
  return h.json({ status: 200, data: { comments } });
});

const authRouter = createRequiredAuthRouter();

authRouter.route(createCommentRoute, async ({ h, input, context }) => {
  const newComment = await createComment(
    input.param.slug,
    input.json.comment.body,
    context.user,
  );
  return h.json({ status: 201, data: { comment: newComment } });
});

authRouter.route(deleteCommentRoute, async ({ h, input, context }) => {
  await deleteComment(input.param.slug, input.param.id, context.user);
  return h.response().code(200);
});

commentsRouter.use('', checkedAuthRouter);
commentsRouter.use('', authRouter);
