import { HonoRouteFactory } from '@node-openapi/hono';
import {
  createOptionalAuthFactory,
  createRequiredAuthFactory,
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

export const commentsController = new HonoRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getCommentsRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const result = await getComments(slug, c.get('user') ?? undefined);
  return c.json({ comments: result });
});

const authFactory = createRequiredAuthFactory();

authFactory.route(createCommentRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const { comment } = c.req.valid('json');
  const result = await createComment(slug, comment.body, c.get('user'));
  return c.json({ comment: result }, 201);
});

authFactory.route(deleteCommentRoute, async (c) => {
  const { slug, id } = c.req.valid('param');
  const result = await deleteComment(slug, id, c.get('user'));
  return c.json({ comment: result });
});

commentsController.router('', checkedAuthFactory);
commentsController.router('', authFactory);
