import { NextFunction, Request, Response } from 'express';
import createUserToken from '../../utils/auth/createUserToken';
import { userCreate } from 'ws-db';
import { hashPassword } from '../../utils/hashPasswords';
import userViewer from '../../view/userViewer';

/**
 * Users controller that registers the user with information given in the body of the request.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function usersRegister(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { email, password, username } = req.body.user;
  try {
    // Hash password
    const hashed = hashPassword(password);

    // Create the new user on the database
    const user = await userCreate(username, email, hashed);

    // Create the authentication token for future use
    const token = createUserToken(user);

    // Create the user view with the authentication token
    const userView = userViewer(user, token);

    res.status(201).json(userView);
    return;
  } catch (error) {
    return next(error);
  }
}
