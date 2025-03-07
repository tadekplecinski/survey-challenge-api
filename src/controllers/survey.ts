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

    const roles = (await creator?.getRoles()!).map(
      (role: any) => role.dataValues.role
    );
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

    const userSurvey = await UserSurvey.findOne({
      where: { id: surveyId },
      include: [
        {
          model: Survey,
        },
        {
          model: Question,
          attributes: ['id', 'question', 'answer'],
        },
      ],
    });

    if (!userSurvey) {
      return res.status(404).send({
        success: false,
        message: 'Survey not found',
      });
    }

    return res.status(200).send({
      success: true,
      data: {
        userSurvey,
      },
    });
  })
);

router.put(
  '/survey/:id/answers',
  auth,
  asyncWrapper(async (req, res) => {
    const requestorEmail = req.body.jwt.email;
    const surveyId = req.params.id;
    const answers = req.body.answers;

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

    const userSurvey = await UserSurvey.findOne({
      where: { surveyId, userId: user.id },
    });

    if (!userSurvey) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this survey',
      });
    }

    try {
      const updatedSurvey = await Survey.updateSurveyAnswers({
        userSurveyId: userSurvey.id,
        answers,
      });

      return res.status(200).json({
        success: true,
        message: 'Survey answers updated successfully',
        data: updatedSurvey,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';

      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  })
);

export default router;
