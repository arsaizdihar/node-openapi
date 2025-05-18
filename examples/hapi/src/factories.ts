import { HapiRouteFactory } from '@node-openapi/hapi';
import { User } from 'ws-common/domain/user.domain';
import { HttpError } from 'ws-common/service/error.service';
import { getUserByToken } from 'ws-common/service/user.service';

export function createOptionalAuthFactory() {
  const factory = new HapiRouteFactory<{ user: User | null }>();

  factory.middleware(async (req, h) => {
    const token = req.headers.authorization;
    if (!token) {
      req.app.user = null;
      return h.continue;
    }

    const [tag, bearerToken] = token.split(' ');
    if (tag !== 'Bearer' && tag !== 'Token') {
      req.app.user = null;
      return h.continue;
    }

    const user = await getUserByToken(bearerToken);
    req.app.user = user;
    return h.continue;
  });

  return factory;
}

export function createRequiredAuthFactory() {
  const factory = createOptionalAuthFactory().extend<{ user: User }>();

  factory.middleware(async (req, h) => {
    if (!req.app.user) {
      return h.response(new HttpError('Unauthorized', 401)).takeover();
    }

    return h.continue;
  });

  return factory;
}
