import { NextFunction, Response, Request } from 'express';
import { updateUser } from 'ws-common/service/user.service';

/**
 * User controller that updates the current user with info given on the body of the request.
 * @param req Request with authenticated user and new information on the body of the request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function userUpdateController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { user } = req.body;
  const currentUser = req.user;
  try {
    const result = await updateUser(currentUser.username, user);
    res.json({ user: result });
    return;
  } catch (error) {
    return next(error);
  }
}
