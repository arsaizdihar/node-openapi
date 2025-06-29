import { NextFunction, Response, Request } from 'express';
import { followProfile as followProfileService } from 'ws-common/service/user.service';

/**
 * Profile controller that adds the username in the parameters to the current user followers list.
 * The parameters of the request must contain the username that will be followed by the authenticated user.
 * @param req Request with authenticated user.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function followProfileController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { username } = req.params;
  try {
    const result = await followProfileService(req.user, username);
    res.json({ profile: result });
  } catch (error) {
    return next(error);
  }
}
