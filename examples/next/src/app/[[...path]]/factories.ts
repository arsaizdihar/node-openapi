import { OpenAPIRouter } from '@node-openapi/next';
import { User } from 'ws-common/domain/user.domain';
import { HttpError } from 'ws-common/service/error.service';
import { getUserByToken } from 'ws-common/service/user.service';

export function createOptionalAuthRouter() {
  const router = new OpenAPIRouter<{ user: User | null }>();

  router.middleware(async ({ req, context }) => {
    const token = req.headers.get('authorization');
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

  return router;
}

export function createRequiredAuthRouter() {
  const router = createOptionalAuthRouter().extend<{ user: User }>();

  router.middleware(async ({ context }) => {
    if (!context.user) {
      throw new HttpError('Unauthorized', 401);
    }
  });

  return router;
}
