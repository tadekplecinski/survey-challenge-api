import { Router } from 'express';

import asyncWrapper from '../utils/async-wrapper.ts';
import JWTUtils from '../utils/jwt-utils.ts';
import { User } from '../models/user.ts';

const router = Router();

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
    await User.create(req.body);

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
