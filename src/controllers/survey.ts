import { Router } from 'express';
import { Op } from 'sequelize';

import asyncWrapper from '../utils/async-wrapper.ts';
import auth from '../middleware/auth.ts';
import { UserSurvey, UserSurveyStatus } from '../models/userSurvey.ts';
import { Question } from '../models/question.ts';
import { Answer } from '../models/answer.ts';
import { User } from '../models/user.ts';
import { Survey } from '../models/survey.ts';
import { Category } from '../models/category.ts';

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

    if (!creator || creator.role !== 'admin') {
      return res.status(403).send({
        success: false,
        message: 'Permission denied',
      });
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

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied',
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
router.put(
  '/survey/:id/answers',
  auth,
  asyncWrapper(async (req, res) => {
    const requestorEmail = req.body.jwt.email;
    const surveyId = req.params.id;
    const answers: { answer: string; answerId?: number; questionId: number }[] =
      req.body.answers;

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

    if (userSurvey.status === 'draft' && req.body.status === 'submitted') {
      await userSurvey.update({ status: UserSurveyStatus.submitted });
    }

    // TODO: this seems wrong
    // test it by updating answers and fetching the updated user survey
    // ------------------------
    // ------------------------
    try {
      // Create or update answers
      const answerPromises = answers.map(async (a) => {
        if (a.answerId) {
          // If answerId is provided, update the existing answer
          await Answer.update(
            { answer: a.answer },
            { where: { id: a.answerId, userSurveyId: userSurvey.id } }
          );
        } else {
          // Otherwise, create a new answer
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
  '/surveys',
  auth,
  asyncWrapper(async (req, res) => {
    try {
      const requestorEmail = req.body.jwt.email;
      const user = await User.findOne({
        where: { email: requestorEmail },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const { title, categoryId, status } = req.query;

      const filters: any = {};

      if (title) {
        filters.title = { [Op.iLike]: `%${title}%` };
      }

      if (status && ['draft', 'completed'].includes(status as string)) {
        filters.status = status;
      }

      if (user.role === 'admin') {
        const categoryFilter = categoryId
          ? {
              model: Category,
              as: 'categories',
              where: { id: categoryId },
              attributes: ['id', 'name'],
              through: { attributes: [] },
            }
          : {
              model: Category,
              as: 'categories',
              attributes: ['id', 'name'],
              through: { attributes: [] },
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
      }

      // listing regular user's surveys
      const userSurveyFilters: any = {
        userId: user.id, // Ensure we only fetch surveys related to the current user
      };

      // Filter by status (UserSurvey's own field)
      if (status && ['draft', 'completed'].includes(status as string)) {
        userSurveyFilters.status = status;
      }

      const includeFilters: any[] = [
        {
          model: Survey,
          required: true, // Ensure each UserSurvey has a related Survey
          include: [
            {
              model: Category,
              as: 'categories',
              attributes: ['id', 'name'],
              through: { attributes: [] }, // Remove unnecessary junction table attributes
              ...(categoryId && { where: { id: categoryId } }),
            },
          ],
        },
      ];

      // Filter by title (Survey's title)
      if (title) {
        includeFilters[0].where = {
          title: { [Op.iLike]: `%${title}%` },
        };
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
      console.error('Error fetching surveys:', error);
      return res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  })
);

router.put(
  '/surveys/:surveyId',
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
