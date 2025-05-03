import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import createUserToken from '../../utils/auth/createUserToken';
import { userGet } from 'ws-db';
import userViewer from '../../view/userViewer';

/**
 * User controller that gets the current user based on the JWT given.
 * @param req Request with an authenticated user on the auth property.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function userGetHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const username = req.auth?.user?.username;
  try {
    // Get current user
    const currentUser = await userGet(username);
    if (!currentUser) {
      res.sendStatus(404);
      return;
    }

    // Create the authentication token
    const token = createUserToken(currentUser);

    // Create the user view with the authentication token
    const response = userViewer(currentUser, token);

    res.json(response);
    return;
  } catch (error) {
    return next(error);
  }
}
