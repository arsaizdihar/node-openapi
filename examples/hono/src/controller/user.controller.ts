import { HonoRouteFactory } from '@node-openapi/hono';
import {
  loginUser,
  registerUser,
  updateUser,
} from 'ws-common/service/user.service';
import { createRequiredAuthFactory } from '../factories';
import {
  getCurrentUserRoute,
  loginRoute,
  registerRoute,
  updateUserRoute,
} from '../routes/user.routes';

export const userController = new HonoRouteFactory();

userController.route(loginRoute, async (c) => {
  const { user } = c.req.valid('json');
  const result = await loginUser(user);
  return c.typedJson({ data: { user: result } });
});

userController.route(registerRoute, async (c) => {
  const { user } = c.req.valid('json');
  const result = await registerUser(user);
  return c.typedJson({ data: { user: result }, status: 201 });
});

const checkedAuthFactory = createRequiredAuthFactory();

checkedAuthFactory.route(getCurrentUserRoute, async (c) => {
  const user = c.get('user');
  return c.typedJson({ data: { user } });
});

checkedAuthFactory.route(updateUserRoute, async (c) => {
  const { user } = c.req.valid('json');
  const currentUser = c.get('user');
  const result = await updateUser(currentUser.username, user);
  return c.typedJson({ data: { user: result } });
});

userController.router('', checkedAuthFactory);
