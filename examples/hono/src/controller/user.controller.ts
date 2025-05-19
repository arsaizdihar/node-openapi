import { HonoRouteFactory } from '@node-openapi/hono';
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

export const userController = new HonoRouteFactory();

userController.route(loginRoute, async (c) => {
  const { user } = c.req.valid('json');
  const result = await loginUser(user);
  return c.json({ user: result });
});

userController.route(registerRoute, async (c) => {
  const { user } = c.req.valid('json');
  const result = await registerUser(user);
  return c.json({ user: result }, 201);
});

const checkedAuthFactory = createRequiredAuthFactory();

checkedAuthFactory.route(getCurrentUserRoute, async (c) => {
  const user = c.get('user');
  return c.json({ user });
});

checkedAuthFactory.route(updateUserRoute, async (c) => {
  const { user } = c.req.valid('json');
  const currentUser = c.get('user');
  const result = await updateUser(currentUser.username, user);
  return c.json({ user: result });
});

userController.router('', checkedAuthFactory);
