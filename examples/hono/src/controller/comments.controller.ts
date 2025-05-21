import { OpenAPIRouter } from '@node-openapi/hono';
import {
  createOptionalAuthRouter,
  createRequiredAuthRouter,
} from '../factories';
import {
  createCommentRoute,
  deleteCommentRoute,
  getCommentsRoute,
} from '../routes/comments.routes';
import {
  getComments,
  createComment,
  deleteComment,
} from 'ws-common/service/comments.service';

export const commentsRouter = new OpenAPIRouter();

const checkedAuthRouter = createOptionalAuthRouter();

checkedAuthRouter.route(getCommentsRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const result = await getComments(slug, c.var.user);
  return c.typedJson({ data: { comments: result } });
});

const authRouter = createRequiredAuthRouter();

authRouter.route(createCommentRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const { comment } = c.req.valid('json');
  const result = await createComment(slug, comment.body, c.var.user);
  return c.typedJson({ data: { comment: result }, status: 201 });
});

authRouter.route(deleteCommentRoute, async (c) => {
  const { slug, id } = c.req.valid('param');
  await deleteComment(slug, id, c.var.user);
  return c.body(null);
});

commentsRouter.use('', checkedAuthRouter);
commentsRouter.use('', authRouter);
