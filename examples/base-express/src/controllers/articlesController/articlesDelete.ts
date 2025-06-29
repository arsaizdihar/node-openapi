import { NextFunction, Response, Request } from 'express';
import { deleteArticle } from 'ws-common/service/articles.service';

/**
 * Article controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug.
 * @param req Request with authenticated user
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesDeleteController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;

  try {
    await deleteArticle(req.user, slug);
    res.status(200).send();
    return;
  } catch (error) {
    return next(error);
  }
}
