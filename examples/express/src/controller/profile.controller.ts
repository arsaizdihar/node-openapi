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
import { ExpressRouteFactory } from '@node-openapi/express';

export const profileController = new ExpressRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(
  getProfileRoute,
  async ({ input, context, h }, next) => {
    const username = input.param.username;
    try {
      const profile = await getProfile(username, context.user ?? undefined);
      h.json({ status: 200, data: { profile } });
    } catch (error) {
      next(error);
    }
  },
);

const authProfileFactory = createRequiredAuthFactory();

authProfileFactory.route(
  followProfileRoute,
  async ({ input, context, h }, next) => {
    const username = input.param.username;
    try {
      const profile = await followProfile(context.user, username);
      h.json({ status: 200, data: { profile } });
    } catch (error) {
      next(error);
    }
  },
);

authProfileFactory.route(
  unfollowProfileRoute,
  async ({ input, context, h }, next) => {
    const username = input.param.username;
    try {
      const profile = await unfollowProfile(context.user, username);
      h.json({ status: 200, data: { profile } });
    } catch (error) {
      next(error);
    }
  },
);

profileController.router('', checkedAuthFactory);
profileController.router('', authProfileFactory);
