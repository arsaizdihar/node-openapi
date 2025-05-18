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

userController.route(loginRoute, async (ctx) => {
  const { user } = ctx.state.input.json;
  const result = await loginUser(user);
  ctx.state.helper.json({ status: 200, data: { user: result } });
});

userController.route(registerRoute, async (ctx) => {
  const { user } = ctx.state.input.json;
  const result = await registerUser(user);
  ctx.state.helper.json({ status: 201, data: { user: result } });
});

const checkedAuthFactory = createRequiredAuthFactory();
checkedAuthFactory.route(getCurrentUserRoute, async (ctx) => {
  const user = ctx.state.user;
  ctx.state.helper.json({ status: 200, data: { user } });
});

checkedAuthFactory.route(updateUserRoute, async (ctx) => {
  const { user } = ctx.state.input.json;
  const currentUser = ctx.state.user;
  const result = await updateUser(currentUser.username, user);
  ctx.state.helper.json({ status: 200, data: { user: result } });
});

userController.router('', checkedAuthFactory);
