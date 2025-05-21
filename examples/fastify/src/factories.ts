import { OpenAPIRouter } from '@node-openapi/fastify';
import { User } from 'ws-common/domain/user.domain';
import { HttpError } from 'ws-common/service/error.service';
import { getUserByToken } from 'ws-common/service/user.service';

export function createOptionalAuthRouter() {
  const factory = new OpenAPIRouter<{ user: User | null }>();

  factory.middleware(async (req, _reply, { context }) => {
    const token = req.headers.authorization;
    if (!token) {
      context.user = null;
      return;
    }

    const [tag, bearerToken] = token.split(' ');
    if (tag !== 'Bearer' && tag !== 'Token') {
      context.user = null;
      return;
    }

    const user = await getUserByToken(bearerToken);
    context.user = user;
  });

  return factory;
}

export function createRequiredAuthRouter() {
  const factory = createOptionalAuthRouter().extend<{ user: User }>();

  factory.middleware(async (_req, _reply, { context }) => {
    if (!context.user) {
      throw new HttpError('Unauthorized', 401);
    }
  });

  return factory;
}
