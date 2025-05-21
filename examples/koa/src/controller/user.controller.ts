import { OpenAPIRouter } from '@node-openapi/koa';
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
  h.json({ data: { user: result } });
});

userRouter.route(registerRoute, async ({ input, h }) => {
  const { user } = input.json;
  const result = await registerUser(user);
  h.json({ status: 201, data: { user: result } });
});

const checkedAuthRouter = createRequiredAuthRouter();
checkedAuthRouter.route(getCurrentUserRoute, async ({ state, h }) => {
  const user = state.user;
  h.json({ data: { user } });
});

checkedAuthRouter.route(updateUserRoute, async ({ input, state, h }) => {
  const { user } = input.json;
  const currentUser = state.user;
  const result = await updateUser(currentUser.username, user);
  h.json({ data: { user: result } });
});

userRouter.use('', checkedAuthRouter);
