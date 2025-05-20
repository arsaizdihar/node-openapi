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
import { NextRouteFactory } from '@node-openapi/next';

export const profileController = new NextRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getProfileRoute, async ({ input, context, h }) => {
  const { username } = input.param;
  const profile = await getProfile(username, context.user);

  return h.json({ data: { profile } });
});

const authProfileFactory = createRequiredAuthFactory();

authProfileFactory.route(followProfileRoute, async ({ input, context, h }) => {
  const { username } = input.param;
  const profile = await followProfile(context.user, username);

  return h.json({ data: { profile } });
});

authProfileFactory.route(
  unfollowProfileRoute,
  async ({ input, context, h }) => {
    const { username } = input.param;
    const profile = await unfollowProfile(context.user, username);

    return h.json({ data: { profile } });
  },
);

profileController.router('', checkedAuthFactory);
profileController.router('', authProfileFactory);
