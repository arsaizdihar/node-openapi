import { NextFunction, Request, Response } from 'express';
import { loginUser } from 'ws-common/service/user.service';

/**
 * Users controller for the login function sending a valid jwt token in the response if login is successful.
 * @param req Request with a body property body containing a json with user object with name and email as properties.
 * @param res Response
 */
export default async function userLoginController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { user } = req.body;
  try {
    const result = await loginUser(user);
    res.json({ user: result });
    return;
  } catch (error) {
    return next(error);
  }
}
