import { Router } from 'express';
import registerRouter from './register.ts';
import loginRouter from './login.ts';
import surveyRouter from './survey.ts';

const router = Router();

router.use(registerRouter);
router.use(loginRouter);
router.use(surveyRouter);

export default router;
