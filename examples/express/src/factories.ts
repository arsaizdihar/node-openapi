import { ExpressRouteFactory } from '@node-openapi/express';
import { User } from 'ws-common/domain/user.domain';
import { HttpError } from 'ws-common/service/error.service';
import { getUserByToken } from 'ws-common/service/user.service';

export function createCheckedAuthFactory() {
  const factory = new ExpressRouteFactory<{ user: User | null }>();

  factory.middleware(async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token || !token.startsWith('Bearer ')) {
        res.locals.user = null;
        return next();
      }

      const bearerToken = token.split(' ')[1];
      const user = await getUserByToken(bearerToken);
      res.locals.user = user;
      next();
    } catch (err) {
      next(err);
    }
  });

  return factory;
}

export function createAuthFactory() {
  const factory = createCheckedAuthFactory().extend<{ user: User }>();

  factory.middleware(async (_req, res, next) => {
    if (!res.locals.user) {
      next(new HttpError('Unauthorized', 401));
      return;
    }

    next();
  });

  return factory;
}
