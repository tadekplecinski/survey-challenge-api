import { Request, Response, Router } from 'express';
import { z } from 'zod';
import auth from '../middleware/auth.ts';
import asyncWrapper from '../utils/async-wrapper.ts';
import { User } from '../models/user.ts';

const router = Router();

router.get(
  '/users/non-admins',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const userRole = req.body.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
        });
      }

      const users = await User.findAll({
        where: { role: 'user' },
        attributes: ['id', 'email', 'userName'],
      });

      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Error fetching non-admin users:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  })
);

export default router;
