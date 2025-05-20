import { KoaRouteFactory } from '@node-openapi/koa';
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
export const commentsController = new KoaRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getCommentsRoute, async ({ input, state, h }) => {
  const slug = input.param.slug;
  const comments = await getComments(slug, state.user);
  h.json({ data: { comments } });
});

const authFactory = createRequiredAuthFactory();

authFactory.route(createCommentRoute, async ({ input, state, h }) => {
  const { slug } = input.param;
  const { comment } = input.json;
  const newComment = await createComment(slug, comment.body, state.user);
  h.json({ status: 201, data: { comment: newComment } });
});

authFactory.route(deleteCommentRoute, async ({ input, state, h }) => {
  const { slug, id } = input.param;
  await deleteComment(slug, id, state.user);
  h.json({ data: null });
});

commentsController.router('', checkedAuthFactory);
commentsController.router('', authFactory);
