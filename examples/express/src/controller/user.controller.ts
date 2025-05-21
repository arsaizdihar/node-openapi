import { OpenAPIRouter } from '@node-openapi/express';
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

userRouter.route(loginRoute, async ({ input, h }, next) => {
  const { user } = input.json;
  try {
    const result = await loginUser(user);
    h.json({ data: { user: result } });
  } catch (error) {
    next(error);
  }
});

userRouter.route(registerRoute, async ({ input, h }, next) => {
  const { user } = input.json;
  try {
    const result = await registerUser(user);
    h.json({ data: { user: result }, status: 201 });
  } catch (error) {
    next(error);
  }
});

const checkedAuthRouter = createRequiredAuthRouter();
checkedAuthRouter.route(getCurrentUserRoute, async ({ context, h }) => {
  const user = context.user;
  h.json({ data: { user } });
});

checkedAuthRouter.route(updateUserRoute, async ({ input, context, h }) => {
  const { user } = input.json;
  const currentUser = context.user;
  const result = await updateUser(currentUser.username, user);
  h.json({ data: { user: result } });
});

userRouter.use('', checkedAuthRouter);
