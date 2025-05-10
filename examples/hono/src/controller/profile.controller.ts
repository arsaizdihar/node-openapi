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

const optionalAuthProfileController = createOptionalAuthFactory();

const requiredAuthProfileController = createRequiredAuthFactory();

optionalAuthProfileController.route(getProfileRoute, async (c) => {
  const { username } = c.req.valid('param');
  const currentUser = c.get('user');
  const profile = await getProfile(username, currentUser);
  return c.json({ profile });
});

requiredAuthProfileController.route(followProfileRoute, async (c) => {
  const { username } = c.req.valid('param');
  const currentUser = c.get('user');
  const profile = await followProfile(currentUser, username);
  return c.json({ profile });
});

requiredAuthProfileController.route(unfollowProfileRoute, async (c) => {
  const { username } = c.req.valid('param');
  const currentUser = c.get('user');
  const profile = await unfollowProfile(currentUser, username);
  return c.json({ profile });
});

export const profileController = new HonoRouteFactory();
profileController.router('', optionalAuthProfileController);
profileController.router('', requiredAuthProfileController);
