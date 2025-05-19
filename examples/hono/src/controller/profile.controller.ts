import { HonoRouteFactory } from '@node-openapi/hono';
import {
  followProfile,
  getProfile,
  unfollowProfile,
} from 'ws-common/service/user.service';
import {
  createOptionalAuthFactory,
  createRequiredAuthFactory,
} from '../factories';
import {
  followProfileRoute,
  getProfileRoute,
  unfollowProfileRoute,
} from '../routes/profile.routes';

export const profileController = new HonoRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getProfileRoute, async (c) => {
  const { username } = c.req.valid('param');
  const profile = await getProfile(username, c.get('user') ?? undefined);
  return c.json({ profile });
});

const authProfileFactory = createRequiredAuthFactory();

authProfileFactory.route(followProfileRoute, async (c) => {
  const { username } = c.req.valid('param');
  const profile = await followProfile(c.get('user'), username);
  return c.json({ profile });
});

authProfileFactory.route(unfollowProfileRoute, async (c) => {
  const { username } = c.req.valid('param');
  const profile = await unfollowProfile(c.get('user'), username);
  return c.json({ profile });
});

profileController.router('', checkedAuthFactory);
profileController.router('', authProfileFactory);
