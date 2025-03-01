import jwt, { SignOptions } from 'jsonwebtoken';
import environment from '../config/environment';

export default class JWTUtils {
  static generateAccessToken(
    payload: string | object,
    options: SignOptions = { expiresIn: '1Day' }
  ) {
    return jwt.sign(payload, environment.jwtAccessTokenSecret, options);
  }

  static generateRefreshToken(payload: string | object) {
    return jwt.sign(payload, environment.jwtRefreshTokenSecret);
  }

  static verifyAccessToken(accessToken: string) {
    return jwt.verify(accessToken, environment.jwtAccessTokenSecret);
  }

  static verifyRefreshToken(refreshToken: string) {
    return jwt.verify(refreshToken, environment.jwtRefreshTokenSecret);
  }
}
