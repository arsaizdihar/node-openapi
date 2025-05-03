import {
  followProfile,
  getProfile,
  unfollowProfile,
} from 'ws-common/service/user.service';
import { createAuthFactory, createCheckedAuthFactory } from '../factories';
import {
  followProfileRoute,
  getProfileRoute,
  unfollowProfileRoute,
} from '../routes/profile.routes';

export const profileController = createCheckedAuthFactory();

profileController.route(getProfileRoute, async (req, res, next) => {
  const { username } = req.params;
  try {
    const profile = await getProfile(username, res.locals.user ?? undefined);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
});

const authProfileFactory = createAuthFactory();

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

profileController.router('', authProfileFactory);
