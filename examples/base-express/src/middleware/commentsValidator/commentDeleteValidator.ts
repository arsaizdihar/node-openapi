import { NextFunction, Response } from 'express';
import { Request } from 'express-jwt';

/**
 * Middleware that validates the id parameter for the comment deletion controller.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default function commentDeleteValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.params.id;
  const slug = req.params.slug;

  if (!id || isNaN(parseInt(id))) {
    res.status(400).json({
      errors: { id: ['comment id must be a valid number'] },
    });
    return;
  }

  if (!slug) {
    res.status(400).json({
      errors: { slug: ['slug is required'] },
    });
    return;
  }

  next();
}
