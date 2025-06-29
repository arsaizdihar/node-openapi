import { NextFunction, Response, Request } from 'express';
import { getArticle } from 'ws-common/service/articles.service';

/**
 * Article controller that must receive a request.
 * The parameters of the request must have a slug.
 * @param req Request with an optional authenticated user
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesGetController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;

  try {
    const result = await getArticle(slug, req.user);
    res.status(200).json({ article: result });
    return;
  } catch (error) {
    return next(error);
  }
}
