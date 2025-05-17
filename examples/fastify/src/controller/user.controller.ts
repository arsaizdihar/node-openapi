import { FastifyRouteFactory } from '@node-openapi/fastify';
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

export const userController = new FastifyRouteFactory();

userController.route(loginRoute, async ({ input }) => {
  const { user } = input.json;
  const result = await loginUser(user);

  return { status: 200 as const, data: { user: result } };
});

userController.route(registerRoute, async ({ input }) => {
  const { user } = input.json;
  const result = await registerUser(user);

  return { status: 201 as const, data: { user: result } };
});

const checkedAuthFactory = createRequiredAuthFactory();
checkedAuthFactory.route(getCurrentUserRoute, async ({ context }) => {
  const user = context.user;

  return { status: 200 as const, data: { user } };
});

checkedAuthFactory.route(updateUserRoute, async ({ context, input }) => {
  const { user } = input.json;
  const currentUser = context.user;
  const result = await updateUser(currentUser.username, user);

  return { status: 200 as const, data: { user: result } };
});

userController.router('', checkedAuthFactory);
