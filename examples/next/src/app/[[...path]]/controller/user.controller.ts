import { OpenAPIRouter } from '@node-openapi/next';
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
import { createRequiredAuthRouter } from '../factories';
export const userRouter = new OpenAPIRouter();

userRouter.route(loginRoute, async ({ input, h }) => {
  const { user } = input.json;
  const result = await loginUser(user);

  return h.json({ data: { user: result } });
});

userRouter.route(registerRoute, async ({ input, h }) => {
  const { user } = input.json;
  const result = await registerUser(user);

  return h.json({ data: { user: result }, status: 201 });
});

const checkedAuthRouter = createRequiredAuthRouter();
checkedAuthRouter.route(getCurrentUserRoute, async ({ context, h }) => {
  const user = context.user;

  return h.json({ data: { user } });
});

checkedAuthRouter.route(updateUserRoute, async ({ input, context, h }) => {
  const { user } = input.json;
  const currentUser = context.user;
  const result = await updateUser(currentUser.username, user);

  return h.json({ data: { user: result } });
});

userRouter.use('', checkedAuthRouter);
