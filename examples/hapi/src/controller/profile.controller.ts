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
import { OpenAPIRouter } from '@node-openapi/hapi';

export const profileRouter = new OpenAPIRouter();

const checkedAuthRouter = createOptionalAuthRouter();

checkedAuthRouter.route(getProfileRoute, async ({ h, input, context }) => {
  const profile = await getProfile(input.param.username, context.user);
  return h.json({ data: { profile } });
});

const authProfileRouter = createRequiredAuthRouter();

authProfileRouter.route(followProfileRoute, async ({ h, input, context }) => {
  const profile = await followProfile(context.user, input.param.username);
  return h.json({ data: { profile } });
});

authProfileRouter.route(unfollowProfileRoute, async ({ h, input, context }) => {
  const profile = await unfollowProfile(context.user, input.param.username);
  return h.json({ data: { profile } });
});

profileRouter.use('', checkedAuthRouter);
profileRouter.use('', authProfileRouter);
