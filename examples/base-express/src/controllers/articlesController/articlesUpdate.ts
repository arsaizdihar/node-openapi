import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { articleUpdate, userGet } from 'ws-db';
import articleViewer from '../../view/articleViewer';

/**
 * Article controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug.
 * The body of the request must have an article object with title, description and body.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesUpdate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const slug = req.params.slug;
  const { title, description, body } = req.body.article;
  const userName = req.auth?.user?.username;

  try {
    // Get current user
    const currentUser = await userGet(userName);
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    // Update the article
    const article = await articleUpdate(currentUser.id, slug, {
      title,
      description,
      body,
    });

    // Create the article view
    const articleView = articleViewer(article, currentUser);
    res.status(200).json({ article: articleView });
    return;
  } catch (error) {
    return next(error);
  }
}
