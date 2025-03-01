import { DbEnvironment } from './database.js';

export interface Environment {
  port: number;
  nodeEnv: DbEnvironment;
  saltRounds: number;
  jwtAccessTokenSecret: string;
  jwtRefreshTokenSecret: string;
}

const environment: Environment = {
  port: parseInt(process.env.PORT || '8080'),
  nodeEnv: (process.env.NODE_ENV || 'production') as DbEnvironment,
  saltRounds: parseInt(process.env.SALT_ROUNDS || '10'),
  jwtAccessTokenSecret:
    process.env.JWT_ACCESS_TOKEN_SECRET ||
    '50f527378a73cce638b92964632fc0995d90ffd2f057ed283104d49507e4f930',
  jwtRefreshTokenSecret:
    process.env.JWT_REFRESH_TOKEN_SECRET ||
    'd0d1055463c07259c2580de2afb37e4e2eba2f25d6021a4051b8ba1218666834',
};

export default environment;
