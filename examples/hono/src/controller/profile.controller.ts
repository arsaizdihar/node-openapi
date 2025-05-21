import { OpenAPIRouter } from '@node-openapi/hono';
import {
  followProfile,
  getProfile,
  unfollowProfile,
} from 'ws-common/service/user.service';
import {
  createOptionalAuthRouter,
  createRequiredAuthRouter,
} from '../factories';
import {
  followProfileRoute,
  getProfileRoute,
  unfollowProfileRoute,
} from '../routes/profile.routes';

export const profileRouter = new OpenAPIRouter();

const checkedAuthRouter = createOptionalAuthRouter();

checkedAuthRouter.route(getProfileRoute, async (c) => {
  const { username } = c.req.valid('param');
  const profile = await getProfile(username, c.var.user);
  return c.typedJson({ data: { profile } });
});

const authRouter = createRequiredAuthRouter();

authRouter.route(followProfileRoute, async (c) => {
  const { username } = c.req.valid('param');
  const profile = await followProfile(c.var.user, username);
  return c.typedJson({ data: { profile } });
});

authRouter.route(unfollowProfileRoute, async (c) => {
  const { username } = c.req.valid('param');
  const profile = await unfollowProfile(c.var.user, username);
  return c.json({ profile });
});

profileRouter.use('', checkedAuthRouter);
profileRouter.use('', authRouter);
