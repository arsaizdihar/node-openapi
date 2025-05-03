import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { userGet, userUnFollowProfile } from 'ws-db';
import profileViewer from '../../view/profileViewer';

/**
 * Profile controller that removes the username in the parameters to the current user followers list.
 * @param req Request with an authenticated user in the auth property
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function unFollowProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const username = req.params.username;
  const currentUsername = req.auth?.user?.username;

  try {
    // Get current user
    const currentUser = await userGet(currentUsername);
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }

    // Get the desired profile
    const profile = await userUnFollowProfile(currentUser.id, username);

    // Create the profile view
    const profileView = profileViewer(profile, currentUser);
    res.json({ profile: profileView });
    return;
  } catch (error) {
    return next(error);
  }
}
