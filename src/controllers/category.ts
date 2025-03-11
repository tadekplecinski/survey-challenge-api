import { Router } from 'express';

import asyncWrapper from '../utils/async-wrapper.ts';
import auth from '../middleware/auth.ts';
import { UserSurvey } from '../models/userSurvey.ts';
import { Question } from '../models/question.ts';
import { Category } from '../models/category.ts';
import { User } from '../models/user.ts';
import { Survey } from '../models/survey.ts';

const router = Router();

router.post(
  '/category',
  auth,
  asyncWrapper(async (req, res) => {
    const creatorEmail = req.body.jwt.email;

    const creator = await User.findOne({
      where: { email: creatorEmail },
    });

    if (!creator) {
      return res.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    if (creator.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Forbidden: You do not have admin rights.' });
    }

    const { name, description, status } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: 'Category name is required' });
    }

    try {
      const category = await Category.create({
        name,
        description,
        status,
      });

      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
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

router.get(
  '/category/:id',
  auth,
  asyncWrapper(async (req, res) => {
    const requestorEmail = req.body.jwt.email;
    const surveyId = req.params.id;

    const user = await User.findOne({
      where: { email: requestorEmail },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const survey = await Survey.findOne({
      where: { id: surveyId },
      include: [
        {
          model: UserSurvey,
          where: { userId: user.id },
          include: [
            {
              model: Question,
              attributes: ['id', 'question', 'answer'],
            },
          ],
        },
      ],
    });

    if (!survey) {
      return res.status(404).send({
        success: false,
        message: 'Survey not found',
      });
    }

    const questions = survey.getQuestions();

    return res.status(200).send({
      success: true,
      data: {
        survey: {
          title: survey.title,
          questions,
        },
      },
    });
  })
);

export default router;
