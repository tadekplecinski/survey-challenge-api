import { Router, Request, Response } from 'express';
import { Op, literal } from 'sequelize';
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
  params: z.object({
    id: z.string(),
  }),
});

const getSurveysSchema = z.object({
  query: z.object({
    title: z.string().optional(),
    categoryId: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
  }),
});

// fetch a survey (admin)
router.get(
  '/admin/survey/:id',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const { params } = getSurveySchema.parse(req);

      const userRole = req.body.user.role;

      if (userRole !== 'admin') {
        return res.status(403).send({
          success: false,
          message: 'Permission denied',
        });
      }
      const { id: surveyId } = params;

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
            required: false, // 'left' join
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
      const { params } = getSurveySchema.parse(req);
      const { id: surveyId } = params;

      const user = await getUserByEmail(req.body.jwt.email);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      const userSurvey = await UserSurvey.findOne({
        where: { id: surveyId, userId: user.id },
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
      const { query } = getSurveysSchema.parse(req);
      const { title, categoryId, status } = query;

      const userRole = req.body.user.role;

      if (userRole !== 'admin') {
        return res.status(403).send({
          success: false,
          message: 'Permission denied',
        });
      }

      const filters: any = {};

      if (title) {
        filters.title = { [Op.iLike]: `%${title}%` };
      }

      if (status) {
        filters.status = status;
      }

      if (categoryId) {
        filters.id = {
          [Op.in]: literal(`(
            SELECT "surveyId"
            FROM "SurveyCategories"
            WHERE "categoryId" = ${categoryId}
          )`),
        };
      }

      const surveys = await Survey.findAndCountAll({
        where: filters,
        include: [
          {
            model: Category,
            as: 'categories',
            attributes: ['id', 'name'],
            through: { attributes: [] },
          },
          {
            model: Question,
            as: 'questions',
            attributes: ['id', 'question'],
          },
        ],
        order: [['createdAt', 'DESC']],
        distinct: true,
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
      const { query } = getSurveysSchema.parse(req);
      const { title, categoryId, status } = query;

      const user = await getUserByEmail(req.body.jwt.email);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      const userSurveyFilters: any = { userId: user.id };
      if (status) userSurveyFilters.status = status;

      if (categoryId) {
        userSurveyFilters.surveyId = {
          [Op.in]: literal(`
              (SELECT "surveyId" 
               FROM "SurveyCategories"
               WHERE "categoryId" = ${categoryId})
            `),
        };
      }

      const surveyFilters: any = {};
      if (title) surveyFilters.title = { [Op.iLike]: `%${title}%` };

      const userSurveys = await UserSurvey.findAndCountAll({
        where: userSurveyFilters,
        include: [
          {
            model: Survey,
            required: true,
            where: surveyFilters,
            include: [
              {
                model: Category,
                as: 'categories',
                attributes: ['id', 'name'],
                through: { attributes: [] },
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
        distinct: true, // otherwise .count is wrong
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
