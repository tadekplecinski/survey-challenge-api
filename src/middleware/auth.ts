import { Request, Response, NextFunction } from 'express';

import JWTUtils from '../utils/jwt-utils.ts';

// export default function requiresAuth() {
export default function (req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  let token: string;

  if (authHeader) {
    try {
      const [bearer, headerToken] = authHeader.split(' ');
      if (bearer.toLowerCase() !== 'bearer' || !headerToken) {
        throw Error;
      }
      token = headerToken;
    } catch (err) {
      res
        .status(401)
        .send({ success: false, message: 'Bearer token malformed' });
      return;
    }
  } else {
    res
      .status(401)
      .send({ success: false, message: 'Authorization header not found' });
    return;
  }

  try {
    const jwt = JWTUtils.verifyAccessToken(token);
    req.body.jwt = jwt;
    next();
  } catch (err) {
    res.status(401).send({ success: false, message: 'Invalid token' });
    return;
  }
}
// }
