import { NextFunction, Response, Request } from 'express';
import { updateArticle } from 'ws-common/service/articles.service';

/**
 * Article controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug.
 * The body of the request must have an article object with title, description and body.
 * @param req Request with authenticated user
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesUpdateController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;
  const { article } = req.body;

  try {
    const result = await updateArticle(req.user, slug, article);
    res.status(200).json({ article: result });
    return;
  } catch (error) {
    return next(error);
  }
}
