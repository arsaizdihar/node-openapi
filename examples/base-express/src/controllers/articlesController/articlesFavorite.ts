import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { articleFavorite, userGet } from 'ws-db';
import articleViewer from '../../view/articleViewer';

/**
 * Article controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesFavorite(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const slug = req.params.slug;
  const username = req.auth?.user.username;

  try {
    // Get current user
    let currentUser = await userGet(username);
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    // Favorite the article
    const article = await articleFavorite(currentUser.id, slug);
    if (!article) {
      res.sendStatus(404);
      return;
    }

    // Retrieve current user after update of its favorited articles
    currentUser = await userGet(username);
    if (!currentUser) {
      res.sendStatus(500);
      return;
    }

    // Create article view
    const articleView = articleViewer(article, currentUser);
    res.json({ article: articleView });
    return;
  } catch (error) {
    next(error);
  }
}
