import { HonoRouteFactory } from '@node-openapi/hono';
import {
  createOptionalAuthFactory,
  createRequiredAuthFactory,
} from '../factories';
import {
  getCommentsRoute,
  createCommentRoute,
  deleteCommentRoute,
} from '../routes/comments.routes';
import {
  getComments,
  createComment,
  deleteComment,
} from 'ws-common/service/comments.service';

const publicCommentController = createOptionalAuthFactory();
const authCommentController = createRequiredAuthFactory();

publicCommentController.route(getCommentsRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const result = await getComments(slug);
  return c.json({ comments: result }, 200);
});

authCommentController.route(createCommentRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const { comment: newCommentData } = c.req.valid('json');
  const currentUser = c.get('user');
  const result = await createComment(slug, newCommentData.body, currentUser);
  return c.json({ comment: result }, 201);
});

authCommentController.route(deleteCommentRoute, async (c) => {
  const { slug, id: commentId } = c.req.valid('param');
  const currentUser = c.get('user');
  await deleteComment(slug, commentId, currentUser);
  return c.body(null, 204);
});

export const commentsController = new HonoRouteFactory();
commentsController.router('', publicCommentController);
commentsController.router('', authCommentController);
