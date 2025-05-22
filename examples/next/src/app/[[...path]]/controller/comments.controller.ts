import { OpenAPIRouter } from '@node-openapi/next';
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

const optionalAuthRouter = createOptionalAuthRouter();

optionalAuthRouter.route(getCommentsRoute, async ({ input, context, h }) => {
  const slug = input.param.slug;
  const comments = await getComments(slug, context.user);

  return h.json({ data: { comments } });
});

const authRouter = createRequiredAuthRouter();

authRouter.route(createCommentRoute, async ({ input, context, h }) => {
  const { slug } = input.param;
  const { comment } = input.json;
  const newComment = await createComment(slug, comment.body, context.user);

  return h.json({ data: { comment: newComment }, status: 201 });
});

authRouter.route(deleteCommentRoute, async ({ input, context, h }) => {
  const { slug, id } = input.param;
  const deletedComment = await deleteComment(slug, id, context.user);

  return h.json({ data: { comment: deletedComment } });
});

commentsRouter.use('', optionalAuthRouter);
commentsRouter.use('', authRouter);
