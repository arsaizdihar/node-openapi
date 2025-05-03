import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from 'express-jwt';
import logger from '../../utils/logger';

/**
 * Middleware that handles authentication errors.
 * @param err Error
 * @param _req Request
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function authErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!(err instanceof UnauthorizedError)) {
    next(err);
    return;
  }

  // Se why authorization failed
  logger.debug(`Authorization failed due to ${err.code}`);
  switch (err.code) {
    case 'credentials_required':
      res.sendStatus(401);
      return;
    case 'credentials_bad_scheme':
      res.status(400).json({
        errors: { header: ['authorization token with bad scheme'] },
      });
      return;
    case 'invalid_token':
      res
        .status(401)
        .json({ errors: { header: ['authorization token is invalid'] } });
      return;
    default:
      logger.error(`Unhandled UnauthorizedError with code ${err.code}`);
      res.sendStatus(500);
      return;
  }
}
