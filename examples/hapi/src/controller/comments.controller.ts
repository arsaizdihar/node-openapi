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

checkedAuthFactory.route(
  getCommentsRoute,
  async (req, _h, { helper, input }) => {
    const comments = await getComments(
      input.param.slug,
      req.app.user ?? undefined,
    );
    return helper.json({ status: 200, data: { comments } });
  },
);

const authFactory = createRequiredAuthFactory();

authFactory.route(createCommentRoute, async (req, _h, { helper, input }) => {
  const newComment = await createComment(
    input.param.slug,
    input.json.comment.body,
    req.app.user,
  );
  return helper.json({ status: 201, data: { comment: newComment } });
});

authFactory.route(deleteCommentRoute, async (req, h, { input }) => {
  await deleteComment(input.param.slug, input.param.id, req.app.user);
  return h.response().code(200);
});

commentsController.router('', checkedAuthFactory);
commentsController.router('', authFactory);
