import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { commentDelete, userGet } from 'ws-db';
import commentViewer from '../../view/commentViewer';

/**
 * Comment controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug to the article the comment belongs to and the id of the comments that will be removed.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function deleteComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug, id } = res.locals.params;
  const username = req.auth?.user?.username;

  try {
    // Get currentUser
    const currentUser = await userGet(username);
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    // Remove comment from database
    const comment = await commentDelete(slug, parseInt(id), currentUser.id);
    if (!comment) {
      res.sendStatus(500);
      return;
    }

    // Create comment view
    const commentView = commentViewer(comment, currentUser);
    res.json({ comment: commentView });
    return;
  } catch (error) {
    return next(error);
  }
}
