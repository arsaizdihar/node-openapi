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

checkedAuthFactory.route(getCommentsRoute, async (ctx) => {
  const slug = ctx.state.input.param.slug;
  const comments = await getComments(slug, ctx.state.user ?? undefined);
  ctx.state.helper.json({ status: 200, data: { comments } });
});

const authFactory = createRequiredAuthFactory();

authFactory.route(createCommentRoute, async (ctx) => {
  const { slug } = ctx.state.input.param;
  const { comment } = ctx.state.input.json;
  const newComment = await createComment(slug, comment.body, ctx.state.user);
  ctx.state.helper.json({ status: 201, data: { comment: newComment } });
});

authFactory.route(deleteCommentRoute, async (ctx) => {
  const { slug, id } = ctx.state.input.param;
  await deleteComment(slug, id, ctx.state.user);
  ctx.status = 200;
});

commentsController.router('', checkedAuthFactory);
commentsController.router('', authFactory);
