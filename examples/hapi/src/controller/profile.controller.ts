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

checkedAuthFactory.route(
  getProfileRoute,
  async (req, _h, { helper, input }) => {
    const profile = await getProfile(
      input.param.username,
      req.app.user ?? undefined,
    );
    return helper.json({ status: 200, data: { profile } });
  },
);

const authProfileFactory = createRequiredAuthFactory();

authProfileFactory.route(
  followProfileRoute,
  async (req, _h, { helper, input }) => {
    const profile = await followProfile(req.app.user, input.param.username);
    return helper.json({ status: 200, data: { profile } });
  },
);

authProfileFactory.route(
  unfollowProfileRoute,
  async (req, _h, { helper, input }) => {
    const profile = await unfollowProfile(req.app.user, input.param.username);
    return helper.json({ status: 200, data: { profile } });
  },
);

profileController.router('', checkedAuthFactory);
profileController.router('', authProfileFactory);
