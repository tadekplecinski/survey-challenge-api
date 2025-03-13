import { Router } from 'express';
import { Op } from 'sequelize';

import asyncWrapper from '../utils/async-wrapper.ts';
import auth from '../middleware/auth.ts';
import { UserSurvey, UserSurveyStatus } from '../models/userSurvey.ts';
import { Question } from '../models/question.ts';
import { Answer } from '../models/answer.ts';
import { User } from '../models/user.ts';
import { Survey, SurveyStatus } from '../models/survey.ts';
import { Category } from '../models/category.ts';

const router = Router();

// create a survey (admin)
router.post(
  '/survey',
  auth,
  asyncWrapper(async (req, res) => {
    const creatorEmail = req.body.jwt.email;
    const { questions, categories } = req.body;

    const creator = await User.findOne({
      where: { email: creatorEmail },
    });

    if (!creator || creator.role !== 'admin') {
      return res.status(403).send({
        success: false,
        message: 'Permission denied',
      });
    }

    const survey = await Survey.createNewSurvey({
      // userId: targetUserId,
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

// fetch single survey (for admin and user)
// for admin it's the survey, for user it's the userSurvey
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
          { model: Question, as: 'questions' },
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
              as: 'questions',
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

// invite user to survey, only if survey is in Published state
router.post(
  '/survey/:id/invite',
  auth,
  asyncWrapper(async (req, res) => {
    try {
      const { jwt, inviteeEmail } = req.body;
      const { id: surveyId } = req.params;
      const requestorEmail = jwt.email;

      // Validate requestor role
      const user = await User.findOne({
        where: { email: requestorEmail },
      });

      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
        });
      }

      // Validate invitee user
      const invitee = await User.findOne({
        where: { email: inviteeEmail },
      });

      if (!invitee) {
        return res.status(404).json({
          success: false,
          message: 'Invitee user not found',
        });
      }

      // Validate survey existence and status
      const survey = await Survey.findOne({
        where: { id: surveyId },
      });

      if (!survey) {
        return res.status(404).json({
          success: false,
          message: 'Survey not found',
        });
      }

      if (survey.status === SurveyStatus.DRAFT) {
        return res.status(403).json({
          success: false,
          message: 'Survey has not been published yet',
        });
      }

      // Create UserSurvey entry
      const userSurvey = await UserSurvey.create({
        userId: invitee.id,
        surveyId: survey.id,
      });

      return res.status(200).json({
        success: true,
        message: 'User invited to the survey successfully',
        userSurvey,
      });
    } catch (error) {
      console.error('Error in /survey/:id/invite:', error); // Log error for debugging

      // Return a generic error message
      return res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again later.',
      });
    }
  })
);

// route to fill out the userSurvey (for invited users - who can see it)
router.put(
  '/survey/:id/answers',
  auth,
  asyncWrapper(async (req, res) => {
    const requestorEmail = req.body.jwt.email;
    const surveyId = req.params.id;
    const answers: { answer: string; questionId: number }[] = req.body.answers;

    const user = await User.findOne({
      where: { email: requestorEmail },
    });

    if (!user || user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied',
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

    if (userSurvey.status === UserSurveyStatus.submitted) {
      return res.status(403).json({
        success: false,
        message: 'This survey cannot be edited anymore',
      });
    }

    if (
      userSurvey.status === 'draft' &&
      req.body.status === UserSurveyStatus.submitted
    ) {
      await userSurvey.update({ status: UserSurveyStatus.submitted });
    }

    try {
      // Create or update answers
      const answerPromises = answers.map(async (a) => {
        let existingAnswer = await Answer.findOne({
          where: { questionId: a.questionId, userSurveyId: userSurvey.id },
        });

        if (existingAnswer) {
          // Update the existing answer
          await existingAnswer.update({ answer: a.answer });
        } else {
          // Create a new answer if none exists
          await Answer.create({
            answer: a.answer,
            questionId: a.questionId,
            userSurveyId: userSurvey.id,
          });
        }
      });

      // Wait for all answer operations to finish
      await Promise.all(answerPromises);

      return res.status(200).json({
        success: true,
        message: 'Answers updated successfully',
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

router.get(
  '/admin/surveys',
  auth,
  asyncWrapper(async (req, res) => {
    try {
      const requestorEmail = req.body.jwt.email;
      const user = await User.findOne({ where: { email: requestorEmail } });

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
      const user = await User.findOne({ where: { email: requestorEmail } });

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

// update survey (admin)
// TODO: test this (updating status works)
router.put(
  '/survey/:surveyId',
  auth,
  asyncWrapper(async (req, res) => {
    try {
      const { surveyId } = req.params;
      const { title, categoryIds, questions, status } = req.body;
      const requestorEmail = req.body.jwt.email;

      const user = await User.findOne({ where: { email: requestorEmail } });

      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
        });
      }

      const survey = await Survey.findByPk(surveyId, {
        include: [
          {
            model: Category,
            as: 'categories',
            attributes: ['id', 'name', 'description', 'status'],
            through: { attributes: [] },
          },
          {
            model: Question,
            as: 'questions',
            attributes: ['id', 'question'],
          },
        ],
      });

      if (!survey) {
        return res
          .status(404)
          .json({ success: false, message: 'Survey not found' });
      }

      if (survey.status === 'published') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update a published survey',
        });
      }

      if (title) {
        survey.title = title;
      }

      if (status && status === 'published') {
        survey.status = status;
      }

      if (categoryIds) {
        const categories = await Category.findAll({
          where: { id: categoryIds },
        });
        await survey.setCategories(categories);
      }

      if (questions && Array.isArray(questions)) {
        for (const q of questions) {
          if (q.id) {
            // If the questionId exists, update the question
            const existingQuestion = await Question.findByPk(q.id);
            if (existingQuestion) {
              existingQuestion.question = q.question;
              await existingQuestion.save();
            }
          } else {
            await Question.create({
              question: q.question,
              surveyId: survey.id,
            });
          }
        }
      }

      await survey.save();

      // Re-fetch the survey with updated associations (including categories)
      const updatedSurvey = await Survey.findByPk(survey.id, {
        include: [
          {
            model: Category,
            as: 'categories',
            attributes: ['id', 'name', 'description', 'status'],
            through: { attributes: [] },
          },
          {
            model: Question,
            as: 'questions',
            attributes: ['id', 'question'],
          },
        ],
      });

      return res.status(200).json({
        success: true,
        message: 'Survey updated successfully',
        data: updatedSurvey,
      });
    } catch (error) {
      console.error('Error updating survey:', error);
      return res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  })
);

// TODO:
// update survey (if draft) - user I THINK WE GOT IT ALREADY?????????????
// user can only 'update' a survey by answering the questions

export default router;
