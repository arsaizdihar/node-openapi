import { ExpressRouteFactory } from '@node-openapi/express';
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
export const commentsController = new ExpressRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(
  getCommentsRoute,
  async ({ input, context, h }, next) => {
    const slug = input.param.slug;
    try {
      const comments = await getComments(slug, context.user);
      h.json({ data: { comments } });
    } catch (error) {
      next(error);
    }
  },
);

const authFactory = createRequiredAuthFactory();

authFactory.route(createCommentRoute, async ({ input, context, h }, next) => {
  const slug = input.param.slug;
  const comment = input.json.comment;
  try {
    const newComment = await createComment(slug, comment.body, context.user);
    h.json({ data: { comment: newComment }, status: 201 });
  } catch (error) {
    next(error);
  }
});

authFactory.route(deleteCommentRoute, async ({ input, context, res }, next) => {
  const slug = input.param.slug;
  const id = input.param.id;
  try {
    await deleteComment(slug, id, context.user);
    res.send();
  } catch (error) {
    next(error);
  }
});

commentsController.router('', checkedAuthFactory);
commentsController.router('', authFactory);
