import { Router, Request, Response } from 'express';
import { z } from 'zod';

import asyncWrapper from '../utils/async-wrapper.ts';
import auth from '../middleware/auth.ts';
import { UserSurvey, UserSurveyStatus } from '../models/userSurvey.ts';
import { Question } from '../models/question.ts';
import { Answer } from '../models/answer.ts';
import { Survey, SurveyStatus } from '../models/survey.ts';
import { Category } from '../models/category.ts';
import { getUserByEmail } from './helpers.ts';

const router = Router();

const createSurveySchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    questions: z.array(z.string().min(1, 'Questions cannot be empty')),
    categoryIds: z.array(z.number().positive('Invalid category ID')),
    status: z.enum([SurveyStatus.DRAFT, SurveyStatus.PUBLISHED]),
  })
  .refine(
    (data) => (data.status === 'published' ? data.questions.length > 0 : true),
    {
      message: 'A survey must have at least one question to be published.',
      path: ['status'],
    }
  );

const inviteUserSchema = z.object({
  inviteeEmail: z.string().email('Invalid email format'),
});

const updateUserSurveySchema = z.object({
  answers: z
    .array(
      z.object({
        answer: z.string().min(1, 'Answer cannot be empty'),
        questionId: z.number().int('Invalid question ID'),
      })
    )
    .optional(),
  status: z
    .enum([UserSurveyStatus.draft, UserSurveyStatus.submitted])
    .optional(),
});

const updateSurveySchema = z.object({
  title: z.string().optional(),
  categoryIds: z.array(z.number().int()).optional(),
  questions: z
    .array(
      z.object({
        id: z.number().int().optional(),
        question: z.string().min(1, 'Question cannot be empty'),
      })
    )
    .optional(),
  status: z.enum(['draft', 'published']).optional(),
});

// create a survey (admin)
router.post(
  '/survey',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const { title, questions, categoryIds, status } =
        createSurveySchema.parse(req.body);

      const userRole = req.body.user.role;
      if (userRole !== 'admin') {
        return res.status(403).send({
          success: false,
          message: 'Permission denied',
        });
      }

      await Survey.createNewSurvey({
        title,
        questions,
        categoryIds,
        status,
      });

      return res.status(200).send({
        success: true,
        message: 'Survey created successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      console.error('Error creating survey:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  })
);

// invite user to survey, only if survey is in Published state
router.post(
  '/survey/:id/invite',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const { inviteeEmail } = inviteUserSchema.parse(req.body);
      const { id: surveyId } = req.params;

      const userRole = req.body.user.role;

      if (userRole !== 'admin') {
        return res.status(403).send({
          success: false,
          message: 'Permission denied',
        });
      }

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

      const invitee = await getUserByEmail(inviteeEmail);

      if (!invitee) {
        return res.status(404).json({
          success: false,
          message: 'Invitee user not found',
        });
      }

      const existingUserSurvey = await UserSurvey.findOne({
        where: { userId: invitee.id, surveyId },
      });

      if (existingUserSurvey) {
        return res.status(409).json({
          success: false,
          message: 'User is already invited to this survey',
        });
      }

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
      console.error('Error in /survey/:id/invite:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again later.',
      });
    }
  })
);

// route to fill out the user survey or submit it (for invited users)
router.put(
  '/survey/:id',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const { answers, status } = updateUserSurveySchema.parse(req.body);
      const { id: userSurveyId } = req.params;

      const user = await getUserByEmail(req.body.user.email);

      if (!user || user.role !== 'user') {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
        });
      }

      const userSurvey = await UserSurvey.findOne({
        where: { id: userSurveyId, userId: user.id },
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

      const survey = await userSurvey.getSurvey();
      const surveyQuestions = await survey.getQuestions();
      const requiredQuestionIds = surveyQuestions.map((q) => q.id);

      const incomingAnswers = Array.isArray(answers) ? answers : [];
      const invalidAnswers = incomingAnswers.some(
        ({ questionId }) => !requiredQuestionIds.includes(questionId)
      );

      if (invalidAnswers) {
        return res.status(400).json({
          success: false,
          message:
            'Some answers contain invalid question IDs that do not belong to this survey.',
        });
      }

      const userSurveyAnswers = await userSurvey.getAnswers();
      const currentUserSurveyAnswerQuestionIds = userSurveyAnswers.map(
        (answer) => answer.questionId
      );

      const answeredQuestionIds = new Set([
        ...currentUserSurveyAnswerQuestionIds,
        ...incomingAnswers.map((a) => a.questionId),
      ]);

      // Check if all required questions have been answered
      const allQuestionsAnswered = requiredQuestionIds.every((qId) =>
        answeredQuestionIds.has(qId)
      );

      if (!allQuestionsAnswered && status === UserSurveyStatus.submitted) {
        return res.status(400).json({
          success: false,
          message: 'All questions must be answered before submitting.',
        });
      }

      if (
        userSurvey.status === 'draft' &&
        status === UserSurveyStatus.submitted &&
        allQuestionsAnswered
      ) {
        await userSurvey.update({ status: UserSurveyStatus.submitted });
        return res.status(200).json({
          success: true,
          message: 'User survey submitted successfully',
        });
      }

      // Create or update answers
      const answerPromises = incomingAnswers.map(async (a) => {
        let existingAnswer = await Answer.findOne({
          where: { questionId: a.questionId, userSurveyId: userSurvey.id },
        });

        if (existingAnswer) {
          await existingAnswer.update({ answer: a.answer });
        } else {
          await Answer.create({
            answer: a.answer,
            questionId: a.questionId,
            userSurveyId: userSurvey.id,
          });
        }
      });

      await Promise.all(answerPromises);

      return res.status(200).json({
        success: true,
        message: 'Answers updated successfully',
      });
    } catch (error) {
      console.error('Error in /survey/:id:', error);

      // Handle validation errors from Zod
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again later.',
      });
    }
  })
);

// update survey (admin)
router.put(
  '/admin/survey/:id',
  auth,
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, categoryIds, questions, status } =
        updateSurveySchema.parse(req.body);

      const userRole = req.body.user.role;

      if (userRole !== 'admin') {
        return res.status(403).send({
          success: false,
          message: 'Permission denied',
        });
      }

      const survey = await Survey.findByPk(id);

      if (!survey) {
        return res
          .status(404)
          .json({ success: false, message: 'Survey not found' });
      }

      if (survey.status === SurveyStatus.PUBLISHED) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update a published survey',
        });
      }

      if (title) survey.title = title;

      if (status === 'published') {
        if (!questions || questions.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot publish a survey without questions',
          });
        }
        survey.status = SurveyStatus.PUBLISHED;
      }

      if (categoryIds && Array.isArray(categoryIds)) {
        const categories = await Category.findAll({
          where: { id: categoryIds },
        });

        await survey.addCategories(categories);
      }

      if (questions && Array.isArray(questions)) {
        const existingQuestionIds = (await survey.getQuestions()).map(
          (q) => q.id
        );
        const incomingQuestionIds = questions
          .filter((q) => q.id)
          .map((q) => q.id);

        // Remove questions that are no longer present in the request
        const questionsToDelete = existingQuestionIds.filter(
          (id) => !incomingQuestionIds.includes(id)
        );

        if (questionsToDelete.length > 0) {
          await Question.destroy({ where: { id: questionsToDelete } });
        }

        // Process incoming questions
        for (const q of questions) {
          if (q.id) {
            // Update existing question
            const existingQuestion = await Question.findByPk(q.id);
            if (existingQuestion) {
              existingQuestion.question = q.question;
              await existingQuestion.save();
            }
          } else {
            // Create new question
            await Question.create({
              question: q.question,
              surveyId: survey.id,
            });
          }
        }
      }

      await survey.save();

      return res.status(200).json({
        success: true,
        message: 'Survey updated successfully',
      });
    } catch (error) {
      console.error('Error updating survey:', error);

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
