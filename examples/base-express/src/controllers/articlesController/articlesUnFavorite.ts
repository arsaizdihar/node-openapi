import { NextFunction, Response, Request } from 'express';
import { unfavoriteArticle } from 'ws-common/service/articles.service';

/**
 * Article controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug.
 * @param req Request with authenticated user
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesUnFavoriteController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;

  try {
    const article = await unfavoriteArticle(req.user, slug);
    res.json({ article });
    return;
  } catch (error) {
    next(error);
  }
}
