export default {
  port: parseInt(process.env.PORT || '8080'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtAccessTokenSecret:
    process.env.JWT_ACCESS_TOKEN_SECRET ||
    '50f527378a73cce638b92964632fc0995d90ffd2f057ed283104d49507e4f930',
};
