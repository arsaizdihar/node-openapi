import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { userGet, articleDelete } from 'ws-db';
import articleViewer from '../../view/articleViewer';

/**
 * Article controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesDelete(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const slug = req.params.slug;
  const userName = req.auth?.user?.username;

  try {
    // Get current user
    const currentUser = await userGet(userName);
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    // Delete the article
    const article = await articleDelete(slug);

    // Create the deleted article view
    const articleView = articleViewer(article, currentUser);
    res.status(200).json({ article: articleView });
    return;
  } catch (error) {
    return next(error);
  }
}
