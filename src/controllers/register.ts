import { Router } from 'express';
import models from '../models/index.js';
import asyncWrapper from '../utils/async-wrapper.ts';
import JWTUtils from '../utils/jwt-utils.ts';

const router = Router();
const { User } = models as any;

router.post(
  '/register',
  asyncWrapper(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user) {
      return res
        .status(200)
        .send({ success: false, message: 'User already exists' });
    }

    const payload = { email };
    const accessToken = JWTUtils.generateAccessToken(payload);
    await User.createNewUser(req.body);

    return res.status(200).send({
      success: true,
      message: 'User successfully registered',
      data: {
        accessToken,
      },
    });
  })
);

export default router;
