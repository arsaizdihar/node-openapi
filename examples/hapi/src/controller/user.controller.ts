import { HapiRouteFactory } from '@node-openapi/hapi';
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
import { createRequiredAuthFactory } from '../factories';
import { HttpError } from 'ws-common/service/error.service';

export const userController = new HapiRouteFactory();

userController.route(loginRoute, async (_req, _h, { helper, input }) => {
  try {
    const result = await loginUser(input.json.user);
    return helper.json({ status: 200, data: { user: result } });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw new HttpError('Invalid email or password', 401);
    }
    throw error;
  }
});

userController.route(registerRoute, async (_req, _h, { helper, input }) => {
  const result = await registerUser(input.json.user);
  return helper.json({ status: 201, data: { user: result } });
});

const checkedAuthFactory = createRequiredAuthFactory();

checkedAuthFactory.route(getCurrentUserRoute, async (req, _h, { helper }) => {
  return helper.json({ status: 200, data: { user: req.app.user } });
});

checkedAuthFactory.route(
  updateUserRoute,
  async (req, _h, { helper, input }) => {
    const result = await updateUser(req.app.user.username, input.json.user);
    return helper.json({ status: 200, data: { user: result } });
  },
);

userController.router('', checkedAuthFactory);
