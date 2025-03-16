import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';

import asyncWrapper from '../utils/async-wrapper.ts';
import auth from '../middleware/auth.ts';
import { UserSurvey } from '../models/userSurvey.ts';
import { Question } from '../models/question.ts';
import { Answer } from '../models/answer.ts';
import { User } from '../models/user.ts';
import { Survey } from '../models/survey.ts';
import { Category } from '../models/category.ts';
import { getUserByEmail } from './helpers.ts';

const router = Router();

const getSurveySchema = z.object({
  jwt: z.object({
    email: z.string().email('Invalid email format'),
  }),
  params: z.object({
    id: z.string(),
  }),
});

const getSurveysSchema = z.object({
  jwt: z.object({
    email: z.string().email('Invalid email format'),
  }),
  query: z.object({
    title: z.string().optional(),
    categoryId: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
  }),
});

// fetch a particular survey (admin)
router.get(
  '/admin/survey/:id',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const { jwt, params } = getSurveySchema.parse(req);

      const user = await getUserByEmail(jwt.email);
      const { id: surveyId } = params;

      if (!user || user.role !== 'admin') {
        return res
          .status(403)
          .json({ success: false, message: 'Unauthorized' });
      }

      const survey = await Survey.findOne({
        where: { id: surveyId },
        include: [
          { model: Question, as: 'questions' },
          {
            model: Category,
            as: 'categories',
            attributes: ['id', 'name', 'description'],
            where: { status: 'active' },
            through: { attributes: [] },
          },
        ],
      });

      if (!survey) {
        return res
          .status(404)
          .json({ success: false, message: 'Survey not found' });
      }

      const questionsCount = await survey.countQuestions();
      const userSurveys = await survey.getUserSurveys({
        include: [{ model: User, attributes: ['email'] }],
      });

      const surveysCount = userSurveys.length;
      const invitedUsersEmails = userSurveys.map(
        (userSurvey) => userSurvey.User!.email
      );

      return res.status(200).json({
        success: true,
        data: { survey, surveysCount, questionsCount, invitedUsersEmails },
      });
    } catch (error) {
      console.error('Error fetching survey:', error);

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

// fetch a survey (for an invited user)
router.get(
  '/survey/:id',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const { jwt, params } = getSurveySchema.parse(req);
      const { id: surveyId } = params;

      const user = await getUserByEmail(jwt.email);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      const userSurvey = await UserSurvey.findOne({
        where: { surveyId, userId: user.id },
        include: [
          {
            model: Survey,
            include: [
              {
                model: Question,
                as: 'questions',
                attributes: ['id', 'question'],
              },
            ],
          },
          Answer,
        ],
      });

      if (!userSurvey) {
        return res
          .status(404)
          .json({ success: false, message: 'Survey not found' });
      }

      return res.status(200).json({ success: true, data: { userSurvey } });
    } catch (error) {
      console.error('Error fetching user survey:', error);

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

// fetch a list of (filtered) surveys (admin)
router.get(
  '/admin/surveys',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const { jwt, query } = getSurveysSchema.parse(req);
      const { title, categoryId, status } = query;

      const user = await getUserByEmail(jwt.email);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const filters: any = {};

      if (title) {
        filters.title = { [Op.iLike]: `%${title}%` };
      }

      if (status) {
        filters.status = status;
      }

      const categoryFilter = {
        model: Category,
        as: 'categories',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        ...(categoryId && { where: { id: categoryId } }),
      };

      const surveys = await Survey.findAndCountAll({
        where: filters,
        include: [categoryFilter],
        order: [['createdAt', 'DESC']],
      });

      return res.status(200).json({
        success: true,
        data: surveys.rows,
        total: surveys.count,
      });
    } catch (error) {
      console.error('Error fetching surveys (Admin):', error);

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

// fetch a list of (filtered) surveys (user)
router.get(
  '/surveys',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const { jwt, query } = getSurveysSchema.parse(req);
      const { title, categoryId, status } = query;

      const user = await getUserByEmail(jwt.email);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      const userSurveyFilters: any = { userId: user.id };

      if (status) userSurveyFilters.status = status;

      const includeFilters: any[] = [
        {
          model: Survey,
          required: true,
          include: [
            {
              model: Category,
              as: 'categories',
              attributes: ['id', 'name'],
              through: { attributes: [] },
              ...(categoryId && { where: { id: categoryId } }),
            },
          ],
        },
      ];

      if (title) {
        includeFilters[0].where = { title: { [Op.iLike]: `%${title}%` } };
      }

      const userSurveys = await UserSurvey.findAndCountAll({
        where: userSurveyFilters,
        include: includeFilters,
        order: [['createdAt', 'DESC']],
      });

      return res.status(200).json({
        success: true,
        data: userSurveys.rows,
        total: userSurveys.count,
      });
    } catch (error) {
      console.error('Error fetching surveys (Admin):', error);

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
