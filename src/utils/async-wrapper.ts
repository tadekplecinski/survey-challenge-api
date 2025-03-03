import { Request, Response, NextFunction } from 'express';

export default function asyncWrapper(
  callback: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<unknown>
) {
  return function (req: Request, res: Response, next: NextFunction): void {
    callback(req, res, next).catch(next);
  };
}
