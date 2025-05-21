import { OpenAPIRouter } from '@node-openapi/fastify';
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

checkedAuthRouter.route(getCommentsRoute, async ({ context, input, h }) => {
  const slug = input.param.slug;
  const comments = await getComments(slug, context.user);

  h.json({ data: { comments } });
});

const authRouter = createRequiredAuthRouter();

authRouter.route(createCommentRoute, async ({ context, input, h }) => {
  const { slug } = input.param;
  const { comment } = input.json;
  const newComment = await createComment(slug, comment.body, context.user);

  h.json({ data: { comment: newComment }, status: 201 });
});

authRouter.route(deleteCommentRoute, async ({ context, input, h }) => {
  const { slug, id } = input.param;
  const deletedComment = await deleteComment(slug, id, context.user);

  h.json({ data: { comment: deletedComment } });
});

commentsRouter.use('', checkedAuthRouter);
commentsRouter.use('', authRouter);
