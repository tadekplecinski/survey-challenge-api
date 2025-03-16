import { Router, Request, Response } from 'express';

import asyncWrapper from '../utils/async-wrapper.ts';
import JWTUtils from '../utils/jwt-utils.ts';
import { User } from '../models/user.ts';
import { z } from 'zod';

const router = Router();

const userLoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }), // You can adjust password length requirements
});

router.post(
  '/login',
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const result = userLoginSchema.safeParse(req.body);

      if (!result.success) {
        // If validation fails, return detailed error message
        return res.status(400).json({
          success: false,
          message: `Validation error: ${result.error.errors
            .map((e) => e.message)
            .join(', ')}`,
        });
      }

      const { email, password } = result.data;

      const user = await User.scope('withPassword').findOne({
        where: { email },
      });

      if (!user || !(await user.comparePasswords(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const payload = { email };
      const accessToken = JWTUtils.generateAccessToken(payload);

      return res.status(200).json({
        success: true,
        message: 'Successfully logged in',
        data: { accessToken },
      });
    } catch (error) {
      console.error('Error logging in:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while logging in',
      });
    }
  })
);

export default router;
