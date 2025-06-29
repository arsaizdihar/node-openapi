import { NextFunction, Response, Request } from 'express';
import { getComments } from 'ws-common/service/comments.service';

/**
 * Comment controller that must receive a request with an optionally authenticated user.
 * The parameters of the request must have a slug to the article the comment belongs to.
 * @param req Request with an optionally authenticated user
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function getCommentsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;

  try {
    const comments = await getComments(slug, req.user);
    res.json({ comments });
    return;
  } catch (error) {
    return next(error);
  }
}
