import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { ParsedQs } from 'qs';
import { articlesList, userGet } from 'ws-db';
import articleViewer from '../../view/articleViewer';

function parseArticleListQuery(query: ParsedQs) {
  let { tag, author, favorited } = query;
  const { limit, offset } = query;
  tag = tag ? (tag as string) : undefined;
  author = author ? (author as string) : undefined;
  favorited = favorited ? (favorited as string) : undefined;
  const limitNumber = limit ? parseInt(limit as string) : undefined;
  const offsetNumber = offset ? parseInt(offset as string) : undefined;
  return { tag, author, favorited, limit: limitNumber, offset: offsetNumber };
}

/**
 * Article controller that must receive a request.
 * @param req Request with an optional jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesListHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { tag, author, favorited, limit, offset } = parseArticleListQuery(
    req.query,
  );
  const username = req.auth?.user?.username;

  try {
    // Get current user
    const currentUser = await userGet(username);

    // Get the articles
    const articles = await articlesList(tag, author, favorited, limit, offset);

    // Create articles view
    const articlesListView = articles.map((article) =>
      currentUser
        ? articleViewer(article, currentUser)
        : articleViewer(article),
    );

    res.json({
      articles: articlesListView,
      articlesCount: articlesListView.length,
    });
    return;
  } catch (error) {
    return next(error);
  }
}
