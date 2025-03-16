import { User } from '../models/user.ts';

export const getUserByEmail = async (email: string) => {
  return User.findOne({ where: { email } });
};
