import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { commentCreate, userGet } from 'ws-db';
import commentViewer from '../../view/commentViewer';

/**
 * Comment controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug to the article the comment belongs to.
 * The body of the request must have an comment object with a body string.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function createComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const slug = req.params.slug;
  const { body: commentContent } = req.body.comment;
  const username = req.auth?.user?.username;

  try {
    // Get currentUser
    const currentUser = await userGet(username);
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    // Add comment to database
    const comment = await commentCreate(slug, commentContent, currentUser);

    // Create comment view
    const commentView = commentViewer(comment, currentUser);
    res.status(201).json({ comment: commentView });
    return;
  } catch (error) {
    return next(error);
  }
}
