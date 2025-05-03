import { TagDB, userGet, tagsCreate, articleCreate } from 'ws-db';
import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';

import articleViewer from '../../view/articleViewer';

interface Article {
  title: string;
  description: string;
  body: string;
  tagList?: Array<string>;
}

/**
 * Article controller that must receive a request with an authenticated user.
 * The body of the request must have the article object that is an @interface Article.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesCreate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { title, description, body, tagList }: Article = req.body.article;
  const userName = req.auth?.user?.username;

  try {
    // Get current user
    const currentUser = await userGet(userName);
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    // Create list of tags
    let tags: TagDB[] = [];
    if (tagList && tagList.length > 0) {
      tags = await tagsCreate(tagList);
    }

    // Create the article
    const article = await articleCreate(
      { title, description, body },
      tags,
      currentUser.username,
    );

    // Create article view
    const articleView = articleViewer(article, currentUser);
    res.status(201).json({ article: articleView });
    return;
  } catch (error) {
    return next(error);
  }
}
