import { Router } from 'express';
import models from '../../models/index.ts';
import asyncWrapper from '../../utils/async-wrapper.ts';
import JWTUtils from '../../utils/jwt-utils.ts';

const router = Router();
const { User } = models;

router.post(
  '/login',
  asyncWrapper(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user || !(await user.comparePasswords(password))) {
      return res
        .status(401)
        .send({ success: false, message: 'Invalid credentials' });
    }

    const payload = { email };
    const accessToken = JWTUtils.generateAccessToken(payload);

    return res.status(200).send({
      success: true,
      message: 'Successfully logged in',
      data: {
        accessToken,
      },
    });
  })
);

export default router;
