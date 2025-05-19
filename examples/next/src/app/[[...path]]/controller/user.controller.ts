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
import { NextResponse } from 'next/server';
export const userController = new NextRouteFactory();

userController.route(loginRoute, async (req, { input }) => {
  const { user } = input.json;
  const result = await loginUser(user);

  return NextResponse.json({ user: result });
});

userController.route(registerRoute, async (req, { input }) => {
  const { user } = input.json;
  const result = await registerUser(user);

  return NextResponse.json({ user: result }, { status: 201 });
});

const checkedAuthFactory = createRequiredAuthFactory();
checkedAuthFactory.route(getCurrentUserRoute, async (req, { context }) => {
  const user = context.user;

  return NextResponse.json({ user });
});

checkedAuthFactory.route(updateUserRoute, async (req, { input, context }) => {
  const { user } = input.json;
  const currentUser = context.user;
  const result = await updateUser(currentUser.username, user);

  return NextResponse.json({ user: result });
});

userController.router('', checkedAuthFactory);
