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
import { HapiRouteFactory } from '@node-openapi/hapi';

export const profileController = new HapiRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getProfileRoute, async ({ h, input, context }) => {
  const profile = await getProfile(input.param.username, context.user);
  return h.json({ data: { profile } });
});

const authProfileFactory = createRequiredAuthFactory();

authProfileFactory.route(followProfileRoute, async ({ h, input, context }) => {
  const profile = await followProfile(context.user, input.param.username);
  return h.json({ data: { profile } });
});

authProfileFactory.route(
  unfollowProfileRoute,
  async ({ h, input, context }) => {
    const profile = await unfollowProfile(context.user, input.param.username);
    return h.json({ data: { profile } });
  },
);

profileController.router('', checkedAuthFactory);
profileController.router('', authProfileFactory);
