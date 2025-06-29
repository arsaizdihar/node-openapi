import { NextFunction, Response, Request } from 'express';
import { createArticle } from 'ws-common/service/articles.service';

/**
 * Article controller that must receive a request with an authenticated user.
 * The body of the request must have the article object.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesCreateController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { article } = req.body;

  try {
    const result = await createArticle(req.user, article);
    res.status(201).json({ article: result });
    return;
  } catch (error) {
    return next(error);
  }
}
