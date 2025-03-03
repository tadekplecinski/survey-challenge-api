import { JsonWebTokenError } from 'jsonwebtoken';
import JWTUtils from '../../utils/jwt-utils.js';

describe('JWT utils', () => {
  it('should create an access token', () => {
    const payload = { email: 'test@example.com' };
    expect(JWTUtils.generateAccessToken(payload)).toEqual(expect.any(String));
  });

  // it('should create a refresh token', () => {
  //   const payload = { email: 'test@example.com' };
  //   expect(JWTUtils.generateRefreshToken(payload)).toEqual(expect.any(String));
  // });

  it('should verify that the access token is valid', () => {
    const payload = { email: 'test@example.com' };
    const token = JWTUtils.generateAccessToken(payload);
    expect(JWTUtils.verifyAccessToken(token)).toEqual(
      expect.objectContaining(payload)
    );
  });

  // it('should verify that the refresh token is valid', () => {
  //   const payload = { email: 'test@example.com' };
  //   const token = JWTUtils.generateRefreshToken(payload);
  //   expect(JWTUtils.verifyRefreshToken(token)).toEqual(
  //     expect.objectContaining(payload)
  //   );
  // });

  it('should error if the access token is invalid', () => {
    expect(() => JWTUtils.verifyAccessToken('invalid.token')).toThrow(
      JsonWebTokenError
    );
  });

  // it('should error if the refresh token is invalid', () => {
  //   expect(() => JWTUtils.verifyRefreshToken('invalid.token')).toThrow(
  //     JsonWebTokenError
  //   );
  // });
});
