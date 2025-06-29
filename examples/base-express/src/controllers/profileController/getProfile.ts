import { NextFunction, Response, Request } from 'express';
import { getProfile as getProfileService } from 'ws-common/service/user.service';

/**
 * Profile controller that takes the username in the parameters and returns its profile.
 * With an optional authenticated user.
 * @param req Request with an optional authenticated user.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function getProfileController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { username } = req.params;

  try {
    const result = await getProfileService(username, req.user);
    res.json({ profile: result });
    return;
  } catch (error) {
    return next(error);
  }
}
