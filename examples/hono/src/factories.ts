import { HonoRouteFactory } from '@node-openapi/hono';
import { User } from 'ws-common/domain/user.domain';
import { HttpError } from 'ws-common/service/error.service';
import { getUserByToken } from 'ws-common/service/user.service';

export type OptionalAuthEnv = {
  Variables: {
    user: User | null;
  };
};

export type RequiredAuthEnv = {
  Variables: {
    user: User;
  };
};

export function createOptionalAuthFactory() {
  const factory = new HonoRouteFactory<OptionalAuthEnv>();

  factory.middleware(async (c, next) => {
    try {
      const authHeader = c.req.header('authorization');
      if (!authHeader) {
        c.set('user', null);
        return next();
      }

      const [tag, token] = authHeader.split(' ');
      if ((tag !== 'Bearer' && tag !== 'Token') || !token) {
        c.set('user', null);
        return next();
      }

      const user = await getUserByToken(token);
      c.set('user', user ?? null);
      await next();
    } catch (err) {
      console.error('[Hono Optional Auth Middleware] Error:', err);
      c.set('user', null);
      await next();
    }
  });

  return factory;
}

export function createRequiredAuthFactory() {
  const factory = createOptionalAuthFactory().extend<RequiredAuthEnv>();

  factory.middleware(async (c, next) => {
    if (!c.get('user')) {
      throw new HttpError('Unauthorized', 401);
    }
    await next();
  });

  return factory;
}
