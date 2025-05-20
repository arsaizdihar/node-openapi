import { KoaRouteFactory } from '@node-openapi/koa';
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

export const userController = new KoaRouteFactory();

userController.route(loginRoute, async ({ input, h }) => {
  const { user } = input.json;
  const result = await loginUser(user);
  h.json({ data: { user: result } });
});

userController.route(registerRoute, async ({ input, h }) => {
  const { user } = input.json;
  const result = await registerUser(user);
  h.json({ status: 201, data: { user: result } });
});

const checkedAuthFactory = createRequiredAuthFactory();
checkedAuthFactory.route(getCurrentUserRoute, async ({ state, h }) => {
  const user = state.user;
  h.json({ data: { user } });
});

checkedAuthFactory.route(updateUserRoute, async ({ input, state, h }) => {
  const { user } = input.json;
  const currentUser = state.user;
  const result = await updateUser(currentUser.username, user);
  h.json({ data: { user: result } });
});

userController.router('', checkedAuthFactory);
