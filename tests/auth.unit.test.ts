import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it } from 'vitest';
import { comparePassword, createAccessToken, createRefreshToken, hashPassword, verifyRefreshToken } from '../src/auth.js';

const originalNodeEnv = process.env.NODE_ENV;
const originalRounds = process.env.BCRYPT_SALT_ROUNDS;

describe('auth helpers', () => {
  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalRounds === undefined) {
      delete process.env.BCRYPT_SALT_ROUNDS;
    } else {
      process.env.BCRYPT_SALT_ROUNDS = originalRounds;
    }
  });

  it('enforces a minimum bcrypt cost in development-like environments', async () => {
    process.env.NODE_ENV = 'test';
    process.env.BCRYPT_SALT_ROUNDS = '2';

    const hash = await hashPassword('password123');
    expect(hash).toContain('$04$');
    await expect(comparePassword('password123', hash)).resolves.toBe(true);
  });

  it('rejects weak bcrypt cost in production and round-trips issued tokens', () => {
    process.env.NODE_ENV = 'production';
    process.env.BCRYPT_SALT_ROUNDS = '2';

    expect(() => hashPassword('password123')).toThrow('BCRYPT_SALT_ROUNDS must be >= 10 in production');

    process.env.BCRYPT_SALT_ROUNDS = '10';

    const accessToken = createAccessToken('user-1', 'user@example.com', 'access-secret', 60);
    expect(jwt.verify(accessToken, 'access-secret')).toMatchObject({
      sub: 'user-1',
      email: 'user@example.com'
    });

    const refreshToken = createRefreshToken('user-1', 'user@example.com', 'session-1', 'refresh-secret', 60);
    expect(verifyRefreshToken(refreshToken.token, 'refresh-secret')).toMatchObject({
      sub: 'user-1',
      email: 'user@example.com',
      sid: 'session-1'
    });
  });

  it('rejects refresh tokens that are not signed with the pinned HS256 algorithm', () => {
    // A token with `alg: none` carries no signature; verification must refuse it
    // rather than accept any algorithm advertised in the token header.
    const forged = jwt.sign({ email: 'user@example.com', sid: 'session-1' }, '', {
      algorithm: 'none',
      subject: 'user-1',
      jwtid: 'jti-1'
    });

    expect(() => verifyRefreshToken(forged, 'refresh-secret')).toThrow();
  });
});
