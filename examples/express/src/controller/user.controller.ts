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
import { createRequiredAuthFactory } from '../factories';

export const userController = new ExpressRouteFactory();

userController.route(loginRoute, async (_, res, next) => {
  const { user } = res.locals.json;
  try {
    const result = await loginUser(user);
    res.locals.helper.json({ status: 200, data: { user: result } });
  } catch (error) {
    next(error);
  }
});

userController.route(registerRoute, async (_, res, next) => {
  const { user } = res.locals.json;
  try {
    const result = await registerUser(user);
    res.locals.helper.json({ status: 201, data: { user: result } });
  } catch (error) {
    next(error);
  }
});

const checkedAuthFactory = createRequiredAuthFactory();
checkedAuthFactory.route(getCurrentUserRoute, async (_, res) => {
  const user = res.locals.user;
  res.locals.helper.json({ status: 200, data: { user } });
});

checkedAuthFactory.route(updateUserRoute, async (_, res) => {
  const { user } = res.locals.json;
  const currentUser = res.locals.user;
  const result = await updateUser(currentUser.username, user);
  res.locals.helper.json({ status: 200, data: { user: result } });
});

userController.router('', checkedAuthFactory);
