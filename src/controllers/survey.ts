import { Router } from 'express';
import models from '../models/index.js';

import asyncWrapper from '../utils/async-wrapper.ts';
import auth from '../middleware/auth.ts';
import { UserSurvey } from '../models/userSurvey.ts';
import { Question } from '../models/question.ts';

const router = Router();
const { User, Survey, Role } = models as any;

router.post(
  '/survey',
  auth,
  asyncWrapper(async (req, res) => {
    const creatorEmail = req.body.jwt.email;
    const targetUserId = req.body.userId;
    const questions = req.body.questions;

    const creator = await User.findOne({
      where: { email: creatorEmail },
      include: Role,
    });

    const roles = creator?.Roles.map((role: any) => role.dataValues.role);
    if (!roles.includes('admin')) {
      return res
        .status(403)
        .json({ message: 'Forbidden: You do not have admin rights.' });
    }

    const survey = await Survey.createNewSurvey({
      userId: targetUserId,
      title: req.body.title,
      questions,
    });

    return res.status(200).send({
      success: true,
      message: 'Survey created successfully',
      data: {
        survey,
      },
    });
  })
);

router.get(
  '/survey/:id',
  auth,
  asyncWrapper(async (req, res) => {
    const requestorEmail = req.body.jwt.email;
    const surveyId = req.params.id;

    const user = await User.findOne({
      where: { email: requestorEmail },
      include: Role,
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

    const questions = survey.dataValues.UserSurveys[0].Questions;

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
