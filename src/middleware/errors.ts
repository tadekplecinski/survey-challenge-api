import { Response, Request, NextFunction } from 'express';

export default function errorsMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Error in errors middleware:\n', err.stack);
  res.status(500).send({ success: false, message: err.message });
}
