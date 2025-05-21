import { OpenAPIRouter } from '@node-openapi/hono';
import {
  loginUser,
  registerUser,
  updateUser,
} from 'ws-common/service/user.service';
import { createRequiredAuthRouter } from '../factories';
import {
  getCurrentUserRoute,
  loginRoute,
  registerRoute,
  updateUserRoute,
} from '../routes/user.routes';

export const userRouter = new OpenAPIRouter();

userRouter.route(loginRoute, async (c) => {
  const { user } = c.req.valid('json');
  const result = await loginUser(user);
  return c.typedJson({ data: { user: result } });
});

userRouter.route(registerRoute, async (c) => {
  const { user } = c.req.valid('json');
  const result = await registerUser(user);
  return c.typedJson({ data: { user: result }, status: 201 });
});

const checkedAuthRouter = createRequiredAuthRouter();

checkedAuthRouter.route(getCurrentUserRoute, async (c) => {
  const user = c.get('user');
  return c.typedJson({ data: { user } });
});

checkedAuthRouter.route(updateUserRoute, async (c) => {
  const { user } = c.req.valid('json');
  const currentUser = c.get('user');
  const result = await updateUser(currentUser.username, user);
  return c.typedJson({ data: { user: result } });
});

userRouter.use('', checkedAuthRouter);
