import { ExpressRouteFactory } from '@node-openapi/express';
import {
  getCurrentUserRoute,
  loginRoute,
  registerRoute,
  updateUserRoute,
} from '../routes/user.routes';
import {
  loginUser,
  registerUser,
  updateUser,
} from 'ws-common/service/user.service';
import { createAuthFactory } from '../factories';

export const userController = new ExpressRouteFactory();

userController.route(loginRoute, async (req, res) => {
  const { user } = req.body;
  const result = await loginUser(user);
  res.status(200).json({ user: result });
});

userController.route(registerRoute, async (req, res) => {
  const { user } = req.body;
  const result = await registerUser(user);
  res.status(201).json({ user: result });
});

const checkedAuthFactory = createAuthFactory();
checkedAuthFactory.route(getCurrentUserRoute, async (_, res) => {
  const user = res.locals.user;
  res.status(200).json({ user });
});

checkedAuthFactory.route(updateUserRoute, async (_, res) => {
  const { user } = res.locals.json;
  const currentUser = res.locals.user;
  const result = await updateUser(currentUser.username, user);
  res.status(200).json({ user: result });
});

userController.router('', checkedAuthFactory);
