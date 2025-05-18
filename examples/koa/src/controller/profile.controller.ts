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

checkedAuthFactory.route(getProfileRoute, async (ctx) => {
  const { username } = ctx.state.input.param;
  const profile = await getProfile(username, ctx.state.user ?? undefined);
  ctx.state.helper.json({ status: 200, data: { profile } });
});

const authProfileFactory = createRequiredAuthFactory();

authProfileFactory.route(followProfileRoute, async (ctx) => {
  const { username } = ctx.state.input.param;
  const profile = await followProfile(ctx.state.user, username);
  ctx.state.helper.json({ status: 200, data: { profile } });
});

authProfileFactory.route(unfollowProfileRoute, async (ctx) => {
  const { username } = ctx.state.input.param;
  const profile = await unfollowProfile(ctx.state.user, username);
  ctx.state.helper.json({ status: 200, data: { profile } });
});

profileController.router('', checkedAuthFactory);
profileController.router('', authProfileFactory);
