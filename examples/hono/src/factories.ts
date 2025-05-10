import { HonoRouteFactory } from '@node-openapi/hono';
import { User } from 'ws-common/domain/user.domain';
import { HttpError } from 'ws-common/service/error.service';
import { getUserByToken } from 'ws-common/service/user.service';

export type OptionalAuthEnv = {
  Variables: {
    user?: User;
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
        c.set('user', undefined);
        return next();
      }

      const [tag, token] = authHeader.split(' ');
      if ((tag !== 'Bearer' && tag !== 'Token') || !token) {
        c.set('user', undefined);
        return next();
      }

      const user = await getUserByToken(token);
      c.set('user', user ?? undefined);
      await next();
    } catch (err) {
      console.error('[Hono Optional Auth Middleware] Error:', err);
      c.set('user', undefined);
      await next();
    }
  });

  return factory;
}

export function createRequiredAuthFactory() {
  const factory = new HonoRouteFactory<RequiredAuthEnv>();

  factory.middleware(async (c, next) => {
    try {
      const authHeader = c.req.header('authorization');
      if (!authHeader) {
        throw new HttpError('Unauthorized: Missing authorization header', 401);
      }

      const [tag, token] = authHeader.split(' ');
      if ((tag !== 'Bearer' && tag !== 'Token') || !token) {
        throw new HttpError('Unauthorized: Invalid token format', 401);
      }

      const user = await getUserByToken(token);
      if (!user) {
        throw new HttpError(
          'Unauthorized: Invalid token or user not found',
          401,
        );
      }

      c.set('user', user);
      await next();
    } catch (err) {
      if (err instanceof HttpError) {
        throw err;
      }
      console.error('[Hono Required Auth Middleware] Unexpected Error:', err);
      throw new HttpError('Internal Server Error during authentication', 500);
    }
  });

  return factory;
}
