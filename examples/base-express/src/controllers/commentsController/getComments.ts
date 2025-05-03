import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { commentsGet, userGet } from 'ws-db';
import commentViewer from '../../view/commentViewer';

/**
 * Comment controller that must receive a request with an optionally authenticated user.
 * The parameters of the request must have a slug to the article the comment belongs to.
 * @param req Request with an optionally jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function getComments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const slug = req.params.slug;
  const username = req.auth?.user?.username;

  try {
    // Get current user from database
    const currentUser = await userGet(username);

    // Get comments from database
    const comments = currentUser
      ? await commentsGet(slug, currentUser.id)
      : await commentsGet(slug);

    // Create comment view
    const commentsView = comments.map((comment) =>
      currentUser
        ? commentViewer(comment, currentUser)
        : commentViewer(comment),
    );

    res.json({ comments: commentsView });
    return;
  } catch (error) {
    return next(error);
  }
}
