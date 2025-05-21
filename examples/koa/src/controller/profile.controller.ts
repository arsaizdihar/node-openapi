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
import { OpenAPIRouter } from '@node-openapi/koa';

export const profileRouter = new OpenAPIRouter();

const checkedAuthRouter = createOptionalAuthRouter();

checkedAuthRouter.route(getProfileRoute, async ({ input, state, h }) => {
  const { username } = input.param;
  const profile = await getProfile(username, state.user);
  h.json({ data: { profile } });
});

const authRouter = createRequiredAuthRouter();

authRouter.route(followProfileRoute, async ({ input, state, h }) => {
  const { username } = input.param;
  const profile = await followProfile(state.user, username);
  h.json({ data: { profile } });
});

authRouter.route(unfollowProfileRoute, async ({ input, state, h }) => {
  const { username } = input.param;
  const profile = await unfollowProfile(state.user, username);
  h.json({ data: { profile } });
});

profileRouter.use('', checkedAuthRouter);
profileRouter.use('', authRouter);
