import { NextFunction, Response, Request } from 'express';
import { getArticlesFeed } from 'ws-common/service/articles.service';
import { parseArticleFeedQuery } from '../../utils/parseQuery';

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
    const query = parseArticleFeedQuery(req.query);
    const result = await getArticlesFeed(req.user, query);
    res.json(result);
    return;
  } catch (error) {
    return next(error);
  }
}
