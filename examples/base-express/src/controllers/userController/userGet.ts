import { NextFunction, Response, Request } from 'express';

/**
 * User controller that gets the current user.
 * @param req Request with an authenticated user.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function userGetController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user;
    res.json({ user });
    return;
  } catch (error) {
    return next(error);
  }
}
