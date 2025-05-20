import { ExpressRouteFactory } from '@node-openapi/express';
import { User } from 'ws-common/domain/user.domain';
import { HttpError } from 'ws-common/service/error.service';
import { getUserByToken } from 'ws-common/service/user.service';

export function createOptionalAuthFactory() {
  const factory = new ExpressRouteFactory<{ user: User | null }>();

  factory.middleware(async ({ req, context }, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        context.user = null;
        return next();
      }

      const [tag, bearerToken] = token.split(' ');
      if (tag !== 'Bearer' && tag !== 'Token') {
        context.user = null;
        return next();
      }

      const user = await getUserByToken(bearerToken);
      context.user = user;
      next();
    } catch (err) {
      next(err);
    }
  });

  return factory;
}

export function createRequiredAuthFactory() {
  const factory = createOptionalAuthFactory().extend<{ user: User }>();

  factory.middleware(async ({ context }, next) => {
    if (!context.user) {
      next(new HttpError('Unauthorized', 401));
      return;
    }

    next();
  });

  return factory;
}
