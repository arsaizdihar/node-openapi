import { NextFunction, Response, Request } from 'express';
import { createComment } from 'ws-common/service/comments.service';

/**
 * Comment controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug to the article the comment belongs to.
 * The body of the request must have an comment object with a body string.
 * @param req Request with authenticated user
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function createCommentController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;
  const { comment } = req.body;

  try {
    const result = await createComment(slug, comment.body, req.user);
    res.status(201).json({ comment: result });
    return;
  } catch (error) {
    return next(error);
  }
}
