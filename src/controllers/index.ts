import { Router } from 'express';
import registerRouter from './register.ts';
import loginRouter from './login.ts';
import retrieveSurveyRouter from './retrieve-survey.ts';
import manageSurveyRouter from './manage-survey.ts';
import categoryRouter from './category.ts';
import userRouter from './retrieve-users.ts';

const router = Router();

router.use(registerRouter);
router.use(loginRouter);
router.use(retrieveSurveyRouter);
router.use(manageSurveyRouter);
router.use(categoryRouter);
router.use(userRouter);

export default router;
