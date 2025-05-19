import { NextRouteFactory } from '@node-openapi/next';
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
import { NextResponse } from 'next/server';
export const commentsController = new NextRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getCommentsRoute, async (req, { input, context }) => {
  const slug = input.param.slug;
  const comments = await getComments(slug, context.user ?? undefined);

  return NextResponse.json({ comments });
});

const authFactory = createRequiredAuthFactory();

authFactory.route(createCommentRoute, async (req, { input, context }) => {
  const { slug } = input.param;
  const { comment } = input.json;
  const newComment = await createComment(slug, comment.body, context.user);

  return NextResponse.json({ comment: newComment });
});

authFactory.route(deleteCommentRoute, async (req, { input, context }) => {
  const { slug, id } = input.param;
  const deletedComment = await deleteComment(slug, id, context.user);

  return NextResponse.json({ comment: deletedComment });
});

commentsController.router('', checkedAuthFactory);
commentsController.router('', authFactory);
