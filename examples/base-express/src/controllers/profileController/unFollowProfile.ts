import { NextFunction, Response, Request } from 'express';
import { unfollowProfile as unfollowProfileService } from 'ws-common/service/user.service';

/**
 * Profile controller that removes the username in the parameters to the current user followers list.
 * @param req Request with an authenticated user
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function unfollowProfileController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { username } = req.params;

  try {
    const result = await unfollowProfileService(req.user, username);
    res.json({ profile: result });
    return;
  } catch (error) {
    return next(error);
  }
}
