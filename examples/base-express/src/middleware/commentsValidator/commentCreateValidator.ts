import { NextFunction, Request, Response } from 'express';

/**
 * Middleware that validates the properties of the request for the comment creation controller.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default function commentCreateValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const comment = req.body.comment;
  if (!comment) {
    res.status(400).json({
      errors: { body: ['the body must contain a comment object'] },
    });
    return;
  }
  if (typeof comment != 'object') {
    res.status(400).json({
      errors: { body: ['the comment  must be an object'] },
    });
    return;
  }
  const body = comment.body;
  if (!body || typeof body != 'string') {
    res.status(400).json({
      errors: {
        body: ['there must be a body string property in the comment object'],
      },
    });
    return;
  }
  next();
}
