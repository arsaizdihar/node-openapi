import { NextFunction, Response, Request } from 'express';
import { getArticles } from 'ws-common/service/articles.service';
import { parseArticleQuery } from '../../utils/parseQuery';

/**
 * Article controller that must receive a request.
 * @param req Request with an optional authenticated user
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesListController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = parseArticleQuery(req.query);
    const result = await getArticles(req.user, query);
    res.json(result);
    return;
  } catch (error) {
    return next(error);
  }
}
