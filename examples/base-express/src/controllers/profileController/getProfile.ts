import { NextFunction, Response } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { userGet } from 'ws-db';
import profileViewer from '../../view/profileViewer';

/**
 * Profile controller that takes the username in the parameters and returns its profile.
 * With an optional authenticated user.
 * @param req Request with an optional authenticated user.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function getProfile(
  req: JWTRequest,
  res: Response,
  next: NextFunction,
) {
  const { username } = req.params;
  const currentUsername = req.auth?.user?.username; // The current user's username

  try {
    // Get current user from database
    const currentUser = await userGet(currentUsername);

    // Get the desired profile
    const profile = await userGet(username);
    if (!profile) {
      res.sendStatus(404);
      return;
    }

    // Create the profile view
    const profileView = currentUser
      ? profileViewer(profile, currentUser)
      : profileViewer(profile);

    res.json({ profile: profileView });
    return;
  } catch (error) {
    return next(error);
  }
}
