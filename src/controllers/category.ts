import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Op } from 'sequelize';

import asyncWrapper from '../utils/async-wrapper.ts';
import auth from '../middleware/auth.ts';
import { Category, CategoryStatus } from '../models/category.ts';
import { getUserByEmail } from './helpers.ts';

const router = Router();

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().min(1, 'Description is required'),
  status: z
    .enum([CategoryStatus.Active, CategoryStatus.Archived])
    .refine((val) => Object.values(CategoryStatus).includes(val), {
      message: 'Invalid status',
    }),
  jwt: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

const listCategoriesQuerySchema = z.object({
  name: z.string().optional(),
  status: z
    .enum([CategoryStatus.Active, CategoryStatus.Archived])
    .optional()
    .refine(
      (val) => val === undefined || Object.values(CategoryStatus).includes(val),
      {
        message: 'Invalid status value. Must be "active" or "archived".',
      }
    ),
});

// create a category
router.post(
  '/category',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const result = createCategorySchema.safeParse(req.body);

      if (!result.success) {
        // If validation fails, return the error details
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: result.error.errors,
        });
      }

      const { name, description, status, jwt } = result.data;

      const creator = await getUserByEmail(jwt.email);

      if (!creator || creator.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
        });
      }

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
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred when creating a category',
      });
    }
  })
);

// list categories (admin)
router.get(
  '/categories',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const requesterEmail = req.body.jwt.email;
      const requester = await getUserByEmail(requesterEmail);

      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
        });
      }

      const { success, error } = listCategoriesQuerySchema.safeParse(req.query);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: `Invalid query parameters: ${error.message}`,
        });
      }

      const { name, status } = req.query;

      const filters: any = {};

      if (name && typeof name === 'string') {
        filters.name = { [Op.iLike]: `%${name}%` };
      }

      if (status) filters.status = status;

      const categories = await Category.findAll({ where: filters });

      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching categories',
      });
    }
  })
);

// archive a category (soft delete)
router.patch(
  '/categories/:id/archive',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const requesterEmail = req.body.jwt.email;
      const requester = await getUserByEmail(requesterEmail);

      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
        });
      }

      const { id } = req.params;

      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      category.status = CategoryStatus.Archived;
      await category.save();

      return res.status(200).json({
        success: true,
        message: 'Category archived successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'An error occurred while archiving the category',
      });
    }
  })
);

export default router;
