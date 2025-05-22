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
import { OpenAPIRouter } from '@node-openapi/next';

export const profileRouter = new OpenAPIRouter();

const optionalAuthRouter = createOptionalAuthRouter();

optionalAuthRouter.route(getProfileRoute, async ({ input, context, h }) => {
  const { username } = input.param;
  const profile = await getProfile(username, context.user);

  return h.json({ data: { profile } });
});

const authRouter = createRequiredAuthRouter();

authRouter.route(followProfileRoute, async ({ input, context, h }) => {
  const { username } = input.param;
  const profile = await followProfile(context.user, username);

  return h.json({ data: { profile } });
});

authRouter.route(unfollowProfileRoute, async ({ input, context, h }) => {
  const { username } = input.param;
  const profile = await unfollowProfile(context.user, username);

  return h.json({ data: { profile } });
});

profileRouter.use('', optionalAuthRouter);
profileRouter.use('', authRouter);
