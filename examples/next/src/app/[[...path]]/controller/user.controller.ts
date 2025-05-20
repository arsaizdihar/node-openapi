import { NextRouteFactory } from '@node-openapi/next';
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
export const userController = new NextRouteFactory();

userController.route(loginRoute, async ({ input, h }) => {
  const { user } = input.json;
  const result = await loginUser(user);

  return h.json({ data: { user: result } });
});

userController.route(registerRoute, async ({ input, h }) => {
  const { user } = input.json;
  const result = await registerUser(user);

  return h.json({ data: { user: result }, status: 201 });
});

const checkedAuthFactory = createRequiredAuthFactory();
checkedAuthFactory.route(getCurrentUserRoute, async ({ context, h }) => {
  const user = context.user;

  return h.json({ data: { user } });
});

checkedAuthFactory.route(updateUserRoute, async ({ input, context, h }) => {
  const { user } = input.json;
  const currentUser = context.user;
  const result = await updateUser(currentUser.username, user);

  return h.json({ data: { user: result } });
});

userController.router('', checkedAuthFactory);
