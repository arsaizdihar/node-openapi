import {
  followProfile,
  getProfile,
  unfollowProfile,
} from 'ws-common/service/user.service';
import {
  createRequiredAuthFactory,
  createOptionalAuthFactory,
} from '../factories';
import {
  followProfileRoute,
  getProfileRoute,
  unfollowProfileRoute,
} from '../routes/profile.routes';
import { KoaRouteFactory } from '@node-openapi/koa';

export const profileController = new KoaRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getProfileRoute, async ({ input, state, h }) => {
  const { username } = input.param;
  const profile = await getProfile(username, state.user);
  h.json({ data: { profile } });
});

const authProfileFactory = createRequiredAuthFactory();

authProfileFactory.route(followProfileRoute, async ({ input, state, h }) => {
  const { username } = input.param;
  const profile = await followProfile(state.user, username);
  h.json({ data: { profile } });
});

authProfileFactory.route(unfollowProfileRoute, async ({ input, state, h }) => {
  const { username } = input.param;
  const profile = await unfollowProfile(state.user, username);
  h.json({ data: { profile } });
});

profileController.router('', checkedAuthFactory);
profileController.router('', authProfileFactory);
