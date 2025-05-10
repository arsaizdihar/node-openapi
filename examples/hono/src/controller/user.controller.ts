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
  const { user: loginData } = c.req.valid('json');
  const result = await loginUser(loginData);
  return c.json({ user: result }, 200);
});

userController.route(registerRoute, async (c) => {
  const { user: registerData } = c.req.valid('json');
  const result = await registerUser(registerData);
  return c.json({ user: result }, 201);
});

const authUserController = createRequiredAuthFactory();

authUserController.route(getCurrentUserRoute, async (c) => {
  const user = c.get('user');
  return c.json({ user: user }, 200);
});

authUserController.route(updateUserRoute, async (c) => {
  const { user: userToUpdate } = c.req.valid('json');
  const currentUser = c.get('user');
  const updatedUser = await updateUser(currentUser.username, userToUpdate);
  return c.json({ user: updatedUser }, 200);
});

userController.router('/', authUserController);
