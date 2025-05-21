import {
  followProfile,
  getProfile,
  unfollowProfile,
} from 'ws-common/service/user.service';
import {
  createRequiredAuthRouter,
  createOptionalAuthRouter,
} from '../factories';
import {
  followProfileRoute,
  getProfileRoute,
  unfollowProfileRoute,
} from '../routes/profile.routes';
import { OpenAPIRouter } from '@node-openapi/express';

export const profileRouter = new OpenAPIRouter();

const checkedAuthRouter = createOptionalAuthRouter();

checkedAuthRouter.route(
  getProfileRoute,
  async ({ input, context, h }, next) => {
    const username = input.param.username;
    try {
      const profile = await getProfile(username, context.user);
      h.json({ data: { profile } });
    } catch (error) {
      next(error);
    }
  },
);

const authRouter = createRequiredAuthRouter();

authRouter.route(followProfileRoute, async ({ input, context, h }, next) => {
  const username = input.param.username;
  try {
    const profile = await followProfile(context.user, username);
    h.json({ status: 200, data: { profile } });
  } catch (error) {
    next(error);
  }
});

authRouter.route(unfollowProfileRoute, async ({ input, context, h }, next) => {
  const username = input.param.username;
  try {
    const profile = await unfollowProfile(context.user, username);
    h.json({ data: { profile } });
  } catch (error) {
    next(error);
  }
});

profileRouter.use('', checkedAuthRouter);
profileRouter.use('', authRouter);
