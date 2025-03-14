import { Router } from 'express';

import asyncWrapper from '../utils/async-wrapper.ts';
import auth from '../middleware/auth.ts';
import { Category } from '../models/category.ts';
import { User } from '../models/user.ts';

const router = Router();

router.post(
  '/category',
  auth,
  asyncWrapper(async (req, res) => {
    const creatorEmail = req.body.jwt.email;

    const creator = await User.findOne({
      where: { email: creatorEmail },
    });

    if (!creator || creator.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied',
      });
    }

    const { name, description, status } = req.body;

    try {
      await Category.create({
        name,
        description,
        status,
      });

      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  })
);

export default router;
