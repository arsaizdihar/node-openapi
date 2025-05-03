import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { ParsedQs } from 'qs';
import { articleFeed, userGet } from 'ws-db';
import articleViewer from '../../view/articleViewer';

function parseQuery(query: ParsedQs) {
  const { limit, offset } = query;
  const limitNumber = limit ? parseInt(limit as string) : undefined;
  const offsetNumber = offset ? parseInt(offset as string) : undefined;
  return { limit: limitNumber, offset: offsetNumber };
}

/**
 * Article controller that must receive a request with an authenticated user.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesFeed(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { limit, offset } = parseQuery(req.query);
  const username = req.auth?.user?.username;

  try {
    // Get current user
    const currentUser = await userGet(username);
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    // Get articles feed
    const articles = await articleFeed(currentUser, limit, offset);

    // Create articles feed view
    const articlesFeedView = articles.map((article) =>
      currentUser
        ? articleViewer(article, currentUser)
        : articleViewer(article),
    );

    res.json({
      articles: articlesFeedView,
      articlesCount: articlesFeedView.length,
    });
    return;
  } catch (error) {
    return next(error);
  }
}
