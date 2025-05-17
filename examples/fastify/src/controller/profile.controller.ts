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
import { FastifyRouteFactory } from '@node-openapi/fastify';

export const profileController = new FastifyRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getProfileRoute, async ({ context, input }) => {
  const { username } = input.param;
  const profile = await getProfile(username, context.user ?? undefined);

  return { status: 200 as const, data: { profile } };
});

const authProfileFactory = createRequiredAuthFactory();

authProfileFactory.route(followProfileRoute, async ({ context, input }) => {
  const { username } = input.param;
  const profile = await followProfile(context.user, username);

  return { status: 200 as const, data: { profile } };
});

authProfileFactory.route(unfollowProfileRoute, async ({ context, input }) => {
  const { username } = input.param;
  const profile = await unfollowProfile(context.user, username);

  return { status: 200 as const, data: { profile } };
});

profileController.router('', checkedAuthFactory);
profileController.router('', authProfileFactory);
