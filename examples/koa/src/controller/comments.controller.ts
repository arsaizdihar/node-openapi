import { OpenAPIRouter } from '@node-openapi/koa';
import {
  createComment,
  deleteComment,
  getComments,
} from 'ws-common/service/comments.service';
import {
  createOptionalAuthRouter,
  createRequiredAuthRouter,
} from '../factories';
import {
  createCommentRoute,
  deleteCommentRoute,
  getCommentsRoute,
} from '../routes/comments.routes';
export const commentsRouter = new OpenAPIRouter();

const checkedAuthRouter = createOptionalAuthRouter();

checkedAuthRouter.route(getCommentsRoute, async ({ input, state, h }) => {
  const slug = input.param.slug;
  const comments = await getComments(slug, state.user);
  h.json({ data: { comments } });
});

const authRouter = createRequiredAuthRouter();

authRouter.route(createCommentRoute, async ({ input, state, h }) => {
  const { slug } = input.param;
  const { comment } = input.json;
  const newComment = await createComment(slug, comment.body, state.user);
  h.json({ status: 201, data: { comment: newComment } });
});

authRouter.route(deleteCommentRoute, async ({ input, state, h }) => {
  const { slug, id } = input.param;
  await deleteComment(slug, id, state.user);
  h.json({ data: null });
});

commentsRouter.use('', checkedAuthRouter);
commentsRouter.use('', authRouter);
