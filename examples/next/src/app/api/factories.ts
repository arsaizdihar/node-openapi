import { NextRouteFactory } from '@node-openapi/next';
import { User } from 'ws-common/domain/user.domain';
import { HttpError } from 'ws-common/service/error.service';
import { getUserByToken } from 'ws-common/service/user.service';

export function createOptionalAuthFactory() {
  const factory = new NextRouteFactory<{ user: User | null }>();

  factory.middleware(async (req, ctx) => {
    const token = req.headers.get('Authorization');
    if (!token) {
      ctx.user = null;
      return;
    }

    const [tag, bearerToken] = token.split(' ');
    if (tag !== 'Bearer' && tag !== 'Token') {
      ctx.user = null;
      return;
    }

    const user = await getUserByToken(bearerToken);
    ctx.user = user;
  });

  return factory;
}

export function createRequiredAuthFactory() {
  const factory = createOptionalAuthFactory().extend<{ user: User }>();

  factory.middleware(async (_req, ctx) => {
    if (!ctx.user) {
      throw new HttpError('Unauthorized', 401);
    }
  });

  return factory;
}
