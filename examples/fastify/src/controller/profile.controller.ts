import {
  followProfile,
  getProfile,
  unfollowProfile,
} from 'ws-common/service/user.service';
import {
  createRequiredAuthRouter,
  createOptionalAuthRouter,
} from '../factories';
import {
  followProfileRoute,
  getProfileRoute,
  unfollowProfileRoute,
} from '../routes/profile.routes';
import { OpenAPIRouter } from '@node-openapi/fastify';

export const profileRouter = new OpenAPIRouter();

const checkedAuthRouter = createOptionalAuthRouter();

checkedAuthRouter.route(getProfileRoute, async ({ context, input, h }) => {
  const { username } = input.param;
  const profile = await getProfile(username, context.user);

  h.json({ data: { profile } });
});

const authRouter = createRequiredAuthRouter();

authRouter.route(followProfileRoute, async ({ context, input, h }) => {
  const { username } = input.param;
  const profile = await followProfile(context.user, username);

  h.json({ data: { profile } });
});

authRouter.route(unfollowProfileRoute, async ({ context, input, h }) => {
  const { username } = input.param;
  const profile = await unfollowProfile(context.user, username);

  h.json({ data: { profile } });
});

profileRouter.use('', checkedAuthRouter);
profileRouter.use('', authRouter);
