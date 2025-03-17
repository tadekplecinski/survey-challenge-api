import { Router, Request, Response } from 'express';

import asyncWrapper from '../utils/async-wrapper.ts';
import JWTUtils from '../utils/jwt-utils.ts';
import { User } from '../models/user.ts';
import { getUserByEmail } from './helpers.ts';
import { z } from 'zod';

const router = Router();

const userRegisterSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }), // Password length validation
  userName: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' }), // Username length validation
});

router.post(
  '/register',
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const result = userRegisterSchema.safeParse(req.body);

      if (!result.success) {
        // If validation fails, return detailed error message
        return res.status(400).json({
          success: false,
          message: `Validation error: ${result.error.errors
            .map((e) => e.message)
            .join(', ')}`,
        });
      }

      const { email, password, userName } = result.data;

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists',
        });
      }

      const newUser = await User.create({ email, password, userName });
      const payload = { email };
      const accessToken = JWTUtils.generateAccessToken(payload);

      return res.status(201).json({
        success: true,
        message: 'User successfully registered',
        accessToken,
      });
    } catch (error) {
      console.error('Error during registration:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while registering the user',
      });
    }
  })
);

export default router;
