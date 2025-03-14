import { Router } from 'express';
import { Op } from 'sequelize';

import asyncWrapper from '../utils/async-wrapper.ts';
import auth from '../middleware/auth.ts';
import { UserSurvey } from '../models/userSurvey.ts';
import { Question } from '../models/question.ts';
import { Answer } from '../models/answer.ts';
import { User } from '../models/user.ts';
import { Survey } from '../models/survey.ts';
import { Category } from '../models/category.ts';

const router = Router();

const getUserByEmail = async (email: string) => {
  return User.findOne({ where: { email } });
};

router.get(
  '/admin/survey/:id',
  auth,
  asyncWrapper(async (req, res) => {
    const requestorEmail = req.body.jwt.email;
    const surveyId = req.params.id;

    const user = await getUserByEmail(requestorEmail);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const survey = await Survey.findOne({
      where: { id: surveyId },
      include: [{ model: Question, as: 'questions' }],
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
  })
);

// Regular user route - Fetch assigned survey
router.get(
  '/survey/:id',
  auth,
  asyncWrapper(async (req, res) => {
    const requestorEmail = req.body.jwt.email;
    const surveyId = req.params.id;

    const user = await getUserByEmail(requestorEmail);
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
  })
);

router.get(
  '/admin/surveys',
  auth,
  asyncWrapper(async (req, res) => {
    try {
      const requestorEmail = req.body.jwt.email;
      const user = await getUserByEmail(requestorEmail);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const { title, categoryId, status } = req.query;
      const filters: any = {};

      if (title) {
        filters.title = { [Op.iLike]: `%${title}%` };
      }

      if (status && ['draft', 'published'].includes(status as string)) {
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
      return res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  })
);

router.get(
  '/surveys',
  auth,
  asyncWrapper(async (req, res) => {
    try {
      const requestorEmail = req.body.jwt.email;
      const user = await getUserByEmail(requestorEmail);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      const { title, categoryId, status } = req.query;

      const userSurveyFilters: any = { userId: user.id };

      if (status && ['draft', 'submitted'].includes(status as string)) {
        userSurveyFilters.status = status;
      }

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
      console.error('Error fetching surveys (User):', error);
      return res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  })
);

export default router;
