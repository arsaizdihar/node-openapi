import { NextFunction, Request, Response } from 'express';
import createUserToken from '../../utils/auth/createUserToken';
import { userGetByEmail } from 'ws-db';
import { compareWithHash } from '../../utils/hashPasswords';
import userViewer from '../../view/userViewer';

/**
 * Users controller for the login function sending a valid jwt token in the response if login is successful.
 * @param req Request with a body property body containing a json with user object with name and email as properties.
 * @param res Response
 */
export default async function userLogin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { email, password } = req.body.user;
  try {
    // Get the user with given email
    const user = await userGetByEmail(email);
    if (!user) {
      res.sendStatus(404);
      return;
    }

    // Compare the user password given with the one stored
    console.log(password, user.password);
    if (!compareWithHash(password, user.password)) {
      res.sendStatus(403);
      return;
    }

    // Create the user token for future authentication
    const token = createUserToken(user);

    // Create the user view containing the authentication token
    const userView = userViewer(user, token);

    res.json(userView);
    return;
  } catch (error) {
    return next(error);
  }
}
