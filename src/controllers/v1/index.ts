import { Router } from 'express';
import registerRouter from './register.ts';
import loginRouter from './login.ts';

const router = Router();

router.use(registerRouter);
router.use(loginRouter);

export default router;
