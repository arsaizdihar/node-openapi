import { OpenAPIRouter } from '@node-openapi/hapi';
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
  UserNotFoundError,
} from 'ws-common/service/user.service';
import { createRequiredAuthRouter } from '../factories';
import { HttpError } from 'ws-common/service/error.service';

export const userRouter = new OpenAPIRouter();

userRouter.route(loginRoute, async ({ h, input }) => {
  try {
    const result = await loginUser(input.json.user);
    return h.json({ status: 200, data: { user: result } });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw new HttpError('Invalid email or password', 401);
    }
    throw error;
  }
});

userRouter.route(registerRoute, async ({ h, input }) => {
  const result = await registerUser(input.json.user);
  return h.json({ status: 201, data: { user: result } });
});

const checkedAuthRouter = createRequiredAuthRouter();

checkedAuthRouter.route(getCurrentUserRoute, async ({ h, context }) => {
  return h.json({ data: { user: context.user } });
});

checkedAuthRouter.route(updateUserRoute, async ({ h, input, context }) => {
  const result = await updateUser(context.user.username, input.json.user);
  return h.json({ data: { user: result } });
});

userRouter.use('', checkedAuthRouter);
