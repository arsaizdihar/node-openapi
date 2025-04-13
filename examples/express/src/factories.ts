import { ExpressRouteFactory } from '@node-openapi/express';
import { inject } from 'inversify';
import { injectable } from 'inversify';
import { UserDTO } from 'ws-common/domain/user.domain';
import { UnauthorizedError } from 'ws-common/errors/http.errors';
import { UserService } from 'ws-common/service/user.service';

@injectable()
export class Factories {
  constructor(
    @inject(UserService)
    private readonly userService: UserService,
  ) {}

  createCheckedAuthFactory() {
    const factory = new ExpressRouteFactory<{ user: UserDTO | null }>();

    factory.middleware(async (req, res, next) => {
      try {
        const token = req.cookies.token;
        if (!token) {
          res.locals.user = null;
          return next();
        }

        const user = this.userService.verifyToken(token);
        if (!user) {
          res.locals.user = null;
          return next();
        }

        res.locals.user = await this.userService.getUserById(user.userId);
        next();
      } catch (err) {
        next(err);
      }
    });

    return factory;
  }

  createAuthFactory() {
    const factory = this.createCheckedAuthFactory().extend<{ user: UserDTO }>();

    factory.middleware(async (_req, res, next) => {
      if (!res.locals.user) {
        next(new UnauthorizedError('Unauthorized'));
        return;
      }

      next();
    });

    return factory;
  }
}
