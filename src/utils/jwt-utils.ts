import jwt, { SignOptions } from 'jsonwebtoken';
import environment from '../config/environment.ts';

export default class JWTUtils {
  static generateAccessToken(
    payload: string | object,
    options: SignOptions = { expiresIn: '1Day' }
  ) {
    return jwt.sign(payload, environment.jwtAccessTokenSecret, options);
  }

  static verifyAccessToken(accessToken: string) {
    return jwt.verify(accessToken, environment.jwtAccessTokenSecret);
  }
}
