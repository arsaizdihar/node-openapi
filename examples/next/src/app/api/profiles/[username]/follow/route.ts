import { createRequiredAuthFactory } from '@/app/api/factories';
import { defaultRouteSecurity } from '@/app/api/security';
import { createRoute, z } from '@node-openapi/next';
import { NextResponse } from 'next/server';
import { profileSchema } from 'ws-common/domain/user.domain';
import { followProfile, unfollowProfile } from 'ws-common/service/user.service';

export const profileFollowController = createRequiredAuthFactory();

const followProfileRoute = createRoute({
  tags: ['profile'],
  method: 'post',
  description: 'Follow profile',
  summary: 'Follow profile',
  path: '/profiles/{username}/follow',
  security: defaultRouteSecurity,
  request: {
    params: z.object({ username: z.string() }),
  },
  responses: {
    200: {
      description: 'Profile followed',
      content: {
        'application/json': { schema: z.object({ profile: profileSchema }) },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

const unfollowProfileRoute = createRoute({
  tags: ['profile'],
  method: 'delete',
  description: 'Unfollow profile',
  summary: 'Unfollow profile',
  path: '/profiles/{username}/follow',
  security: defaultRouteSecurity,
  request: {
    params: z.object({ username: z.string() }),
  },
  responses: {
    200: {
      description: 'Profile unfollowed',
      content: {
        'application/json': { schema: z.object({ profile: profileSchema }) },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

profileFollowController.handler(followProfileRoute, async (req, ctx) => {
  const { username } = ctx.input.param;
  const profile = await followProfile(ctx.user, username);
  return NextResponse.json({ profile });
});

profileFollowController.handler(unfollowProfileRoute, async (req, ctx) => {
  const { username } = ctx.input.param;
  const profile = await unfollowProfile(ctx.user, username);
  return NextResponse.json({ profile });
});

export const { POST, DELETE } = profileFollowController.handlers;
