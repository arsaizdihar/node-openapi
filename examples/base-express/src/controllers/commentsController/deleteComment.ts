import { NextFunction, Response, Request } from 'express';
import { deleteComment } from 'ws-common/service/comments.service';

/**
 * Comment controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug to the article the comment belongs to and the id of the comments that will be removed.
 * @param req Request with authenticated user
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function deleteCommentController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug, id } = req.params;

  try {
    const result = await deleteComment(slug, parseInt(id), req.user);
    res.json({ comment: result });
    return;
  } catch (error) {
    return next(error);
  }
}
