import { OpenAPIRouter } from '@node-openapi/koa';
import { User } from 'ws-common/domain/user.domain';
import { HttpError } from 'ws-common/service/error.service';
import { getUserByToken } from 'ws-common/service/user.service';

export type OptionalAuthEnv = {
  user: User | null;
};

export type RequiredAuthEnv = {
  user: User;
};

export function createOptionalAuthRouter() {
  const router = new OpenAPIRouter<OptionalAuthEnv>();

  router.middleware(async (c, next) => {
    const authHeader = c.req.headers.authorization;
    if (!authHeader) {
      c.state.user = null;
      return next();
    }

    const [tag, token] = authHeader.split(' ');
    if ((tag !== 'Bearer' && tag !== 'Token') || !token) {
      c.state.user = null;
      return next();
    }

    const user = await getUserByToken(token);
    c.state.user = user;
    await next();
  });

  return router;
}

export function createRequiredAuthRouter() {
  const router = createOptionalAuthRouter().extend<RequiredAuthEnv>();

  router.middleware(async (c, next) => {
    if (!c.state.user) {
      throw new HttpError('Unauthorized', 401);
    }
    await next();
  });

  return router;
}
