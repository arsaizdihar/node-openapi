import { NextFunction, Response, Request } from 'express';
import { getArticlesFeed } from 'ws-common/service/articles.service';

/**
 * Article controller that must receive a request with an authenticated user.
 * @param req Request with authenticated user
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesFeedController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getArticlesFeed(req.user, req.query);
    res.json(result);
    return;
  } catch (error) {
    return next(error);
  }
}
