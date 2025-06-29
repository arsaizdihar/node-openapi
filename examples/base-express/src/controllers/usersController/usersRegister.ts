import { NextFunction, Request, Response } from 'express';
import { registerUser } from 'ws-common/service/user.service';

/**
 * Users controller that registers the user with information given in the body of the request.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function usersRegisterController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { user } = req.body;
  try {
    const result = await registerUser(user);
    res.status(201).json({ user: result });
    return;
  } catch (error) {
    return next(error);
  }
}
