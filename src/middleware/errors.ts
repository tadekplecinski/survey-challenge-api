import { Response } from 'express';

export default function errorsMiddleware(err: Error, _req: any, res: Response) {
  console.error('Error in errors middleware:\n', err.stack);
  res.status(500).send({ success: false, message: err.message });
}
