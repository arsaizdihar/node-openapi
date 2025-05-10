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

checkedAuthFactory.route(getCommentsRoute, async (req, res, next) => {
  const slug = req.params.slug;
  try {
    const comments = await getComments(slug, res.locals.user ?? undefined);
    res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
});

const authFactory = createRequiredAuthFactory();

authFactory.route(createCommentRoute, async (_, res, next) => {
  const { slug } = res.locals.param;
  const { comment } = res.locals.json;
  try {
    const newComment = await createComment(slug, comment.body, res.locals.user);
    res.status(201).json({ comment: newComment });
  } catch (error) {
    next(error);
  }
});

authFactory.route(deleteCommentRoute, async (_, res, next) => {
  const { slug, id } = res.locals.param;
  try {
    const deletedComment = await deleteComment(slug, id, res.locals.user);
    res.status(200).json({ comment: deletedComment });
  } catch (error) {
    next(error);
  }
});

commentsController.router('', checkedAuthFactory);
commentsController.router('', authFactory);
