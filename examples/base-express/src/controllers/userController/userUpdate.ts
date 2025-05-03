import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';
import createUserToken from '../../utils/auth/createUserToken';
import { userUpdate } from 'ws-db';
import userViewer from '../../view/userViewer';

/**
 * User controller that updates the current user with info given on the body of the request.
 * @param req Request with authenticated user in the auth property and new information on the body of the request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function userUpdateHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const username = req.auth?.user?.username;
  const info = req.body.user;
  try {
    // Get current user
    const user = await userUpdate(username, info);
    if (!user) {
      res.sendStatus(404);
      return;
    }

    // Create the user token for future authentications
    const token = createUserToken(user);

    // Create the user view with the authenticated token
    const userView = userViewer(user, token);

    res.json(userView);
    return;
  } catch (error) {
    return next(error);
  }
}
