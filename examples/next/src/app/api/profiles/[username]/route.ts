import { createRoute, z } from '@node-openapi/next';
import { profileSchema } from 'ws-common/domain/user.domain';
import { defaultRouteSecurity } from '../../security';
import { createOptionalAuthFactory } from '../../factories';
import { getProfile } from 'ws-common/service/user.service';
import { NextResponse } from 'next/server';
import { profileFollowController } from './follow/route';

export const profileController = createOptionalAuthFactory();

const getProfileRoute = createRoute({
  tags: ['profile'],
  method: 'get',
  description: 'Get profile',
  summary: 'Get profile',
  path: '/profiles/{username}',
  security: defaultRouteSecurity,
  request: {
    params: z.object({ username: z.string() }),
  },
  responses: {
    200: {
      description: 'Profile',
      content: {
        'application/json': { schema: z.object({ profile: profileSchema }) },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

profileController.handler(getProfileRoute, async (req, ctx) => {
  const { username } = ctx.input.param;
  const profile = await getProfile(username, ctx.user ?? undefined);
  return NextResponse.json({ profile });
});

export const { GET } = profileController.router(
  profileFollowController,
).handlers;
