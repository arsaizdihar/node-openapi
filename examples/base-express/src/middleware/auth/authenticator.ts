import { NextFunction, Request, Response } from 'express';
import { getUserByToken } from 'ws-common/service/user.service';

/**
 * Middleware for required authentication
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json({ errors: { body: ['Unauthorized'] } });
      return;
    }

    const [tag, bearerToken] = token.split(' ');
    if (tag !== 'Bearer' && tag !== 'Token') {
      res.status(401).json({ errors: { body: ['Unauthorized'] } });
      return;
    }

    const user = await getUserByToken(bearerToken);
    if (!user) {
      res.status(401).json({ errors: { body: ['Unauthorized'] } });
      return;
    }

    req.user = user;
    next();
  } catch (_err) {
    res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }
}

/**
 * Middleware for optional authentication
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const token = req.headers.authorization;
    if (!token) {
      req.user = null;
      return next();
    }

    const [tag, bearerToken] = token.split(' ');
    if (tag !== 'Bearer' && tag !== 'Token') {
      req.user = null;
      return next();
    }

    const user = await getUserByToken(bearerToken);
    req.user = user;
    next();
  } catch (_err) {
    req.user = null;
    next();
  }
}
