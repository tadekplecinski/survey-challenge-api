import { Router } from 'express';
import models from '../models/index.js';

import asyncWrapper from '../utils/async-wrapper.ts';
import auth from '../middleware/auth.ts';
import { UserSurvey } from '../models/userSurvey.ts';
import { Question } from '../models/question.ts';
import { Answer } from '../models/answer.ts';

const router = Router();
const { User, Survey, Role } = models as any;

router.post(
  '/survey',
  auth,
  asyncWrapper(async (req, res) => {
    const creatorEmail = req.body.jwt.email;
    const { userId: targetUserId, questions, categories } = req.body;

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
      categories,
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

// TODO:
// for admin we fetch a survey which can be edited (if draft)
// for user we fetch a survey (from userSurveys) to be filled out
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

// route to fill out the survey (for invited users - who can see it)
router.post(
  '/survey/:id/answers',
  auth,
  asyncWrapper(async (req, res) => {
    const requestorEmail = req.body.jwt.email;
    const surveyId = req.params.id;
    const answers: { answer: string; questionId: number }[] = req.body.answers; // {answer: string; questionId: number}

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
      await Answer.bulkCreate(
        answers.map((a) => ({
          answer: a.answer,
          questionId: a.questionId,
          userSurveyId: userSurvey.id,
        }))
      );

      return res.status(200).json({
        success: true,
        message: 'Answers added successfully',
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

// TODO:
// get all surveys
// survey status (admin): published / draft (?)
// survey status (user): draft / completed / not completed
// get surveys filterd by...
// update survey (if UNPUBLISHED!)
// seed categories and users DONE

export default router;
