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
import { NextResponse } from 'next/server';

export const profileController = new NextRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getProfileRoute, async (req, { input, context }) => {
  const { username } = input.param;
  const profile = await getProfile(username, context.user ?? undefined);

  return NextResponse.json({ profile });
});

const authProfileFactory = createRequiredAuthFactory();

authProfileFactory.route(
  followProfileRoute,
  async (req, { input, context }) => {
    const { username } = input.param;
    const profile = await followProfile(context.user, username);

    return NextResponse.json({ profile });
  },
);

authProfileFactory.route(
  unfollowProfileRoute,
  async (req, { input, context }) => {
    const { username } = input.param;
    const profile = await unfollowProfile(context.user, username);

    return NextResponse.json({ profile });
  },
);

profileController.router('', checkedAuthFactory);
profileController.router('', authProfileFactory);
