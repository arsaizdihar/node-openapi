import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import { userFollowProfile, userGet } from 'ws-db';
import profileViewer from '../../view/profileViewer';

/**
 * Profile controller that adds the username in the parameters to the current user followers list.
 * The parameters of the request must contain the username that will be followed by the authenticated user.
 * @param req Request with authenticated user in the auth property.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function followProfile(
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

    // Get the user profile to follow
    const profile = await userFollowProfile(currentUser.id, username);

    // Create the profile view.
    const profileView = profileViewer(profile, currentUser);

    return res.json({ profile: profileView });
  } catch (error) {
    return next(error);
  }
}
