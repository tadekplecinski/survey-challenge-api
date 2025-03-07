import { Router } from 'express';
import registerRouter from './register.ts';
import loginRouter from './login.ts';
import surveyRouter from './survey.ts';
import categoryRouter from './category.ts';

const router = Router();

router.use(registerRouter);
router.use(loginRouter);
router.use(surveyRouter);
router.use(categoryRouter);

export default router;
