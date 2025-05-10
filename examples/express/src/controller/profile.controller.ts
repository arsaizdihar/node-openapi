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

checkedAuthFactory.route(getProfileRoute, async (req, res, next) => {
  const { username } = req.params;
  try {
    const profile = await getProfile(username, res.locals.user ?? undefined);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
});

const authProfileFactory = createRequiredAuthFactory();

authProfileFactory.route(followProfileRoute, async (req, res, next) => {
  const { username } = req.params;
  try {
    const profile = await followProfile(res.locals.user, username);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
});

authProfileFactory.route(unfollowProfileRoute, async (req, res, next) => {
  const { username } = req.params;
  try {
    const profile = await unfollowProfile(res.locals.user, username);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
});

profileController.router('', checkedAuthFactory);
profileController.router('', authProfileFactory);
