import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import ms from 'ms';
import { UserService } from 'ws-common/service/user.service';
import {
  loginRoute,
  logoutRoute,
  meRoute,
  registerRoute,
} from '../routes/user.routes';
import { BaseController } from './base.controller';
import { Factories } from '../factories';

@injectable()
export class UserController extends BaseController {
  constructor(
    @inject(UserService)
    private readonly userService: UserService,
    @inject(Factories)
    private readonly factories: Factories,
  ) {
    super();

    const checkedAuthFactory = this.factories.createCheckedAuthFactory();

    this.factory.route(
      loginRoute,
      async (_req: Request, res: Response, next: NextFunction) => {
        try {
          const { email, password } = res.locals.json;
          const { user, token, expiresIn } = await this.userService.login({
            email,
            password,
          });

          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: ms(expiresIn),
          });

          res.status(200).json(user);
          next();
        } catch (error) {
          next(error);
        }
      },
    );

    this.factory.route(
      registerRoute,
      async (_req: Request, res: Response, next: NextFunction) => {
        try {
          const { user, token, expiresIn } = await this.userService.register(
            res.locals.json,
          );

          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: ms(expiresIn),
          });

          res.status(200).json(user);
        } catch (error) {
          next(error);
        }
      },
    );

    this.factory.route(
      logoutRoute,
      async (_req: Request, res: Response, next: NextFunction) => {
        res.clearCookie('token');
        res.status(200).send();
        next();
      },
    );

    checkedAuthFactory.route(meRoute, async (_, res) => {
      res.status(200).json(res.locals.user);
    });

    this.factory.router('/', checkedAuthFactory);
  }
}
