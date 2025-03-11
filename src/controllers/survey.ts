import { Router } from 'express';

import asyncWrapper from '../utils/async-wrapper.ts';
import auth from '../middleware/auth.ts';
import { UserSurvey } from '../models/userSurvey.ts';
import { Question } from '../models/question.ts';
import { Answer } from '../models/answer.ts';
import { User } from '../models/user.ts';
import { Survey } from '../models/survey.ts';

const router = Router();

router.post(
  '/survey',
  auth,
  asyncWrapper(async (req, res) => {
    const creatorEmail = req.body.jwt.email;
    const { userId: targetUserId, questions, categories } = req.body;

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

router.get(
  '/survey/:id',
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

    const isAdmin = user.role === 'admin';

    // admin path
    if (isAdmin) {
      const survey = await Survey.findOne({
        where: { id: surveyId },
        include: [
          { model: Question },
          {
            model: UserSurvey,
            include: [{ model: User }],
          },
        ],
      });

      if (!survey) {
        return res.status(404).send({
          success: false,
          message: 'Survey not found',
        });
      }

      const questionsCount = (await survey.getQuestions()).length;
      const userSurveys = await survey.getUserSurveys({
        include: [{ model: User, attributes: ['email'] }],
      });
      const surveysCount = userSurveys.length;

      const invitedUsersEmails = userSurveys.map(
        (userSurvey) => userSurvey.User!.email
      );

      if (!survey) {
        return res.status(404).send({
          success: false,
          message: 'Survey not found',
        });
      }

      return res.status(200).send({
        success: true,
        data: {
          survey,
          surveysCount,
          questionsCount,
          invitedUsersEmails,
        },
      });
    }

    // regular user path
    const userSurvey = await UserSurvey.findOne({
      where: { id: surveyId, userId: user.id },
      include: [
        {
          model: Survey,
          include: [
            {
              model: Question,
              attributes: ['id', 'question'],
            },
          ],
        },
        Answer,
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

router.post(
  '/survey/:id/invite',
  auth,
  asyncWrapper(async (req, res) => {
    const requestorEmail = req.body.jwt.email;
    const inviteeEmail = req.body.inviteeEmail;
    const surveyId = req.params.id;

    const user = await User.findOne({
      where: { email: requestorEmail },
    });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Only admin can invite a user to a survey',
      });
    }

    const invitee = await User.findOne({
      where: { email: inviteeEmail },
    });

    if (!invitee) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const userSurvey = await UserSurvey.create({
      userId: invitee.id,
      surveyId: +surveyId,
    });

    res.status(200).json({
      success: true,
      message: 'User invited to a survey',
      userSurvey,
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
    const answers: { answer: string; questionId: number }[] = req.body.answers;

    const user = await User.findOne({
      where: { email: requestorEmail },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Admins cannot fill out surveys',
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
