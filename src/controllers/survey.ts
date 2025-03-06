import { Router } from 'express';
import models from '../models/index.js';
import asyncWrapper from '../utils/async-wrapper.ts';
import JWTUtils from '../utils/jwt-utils.ts';
import auth from '../middleware/auth.ts';

const router = Router();
const { User, Survey } = models as any;

router.post(
  '/survey',
  auth,
  asyncWrapper(async (req, res) => {
    // console.log('req ------------', req);
    const userEmail = req.body.jwt.email;
    const { id } = await User.findOne({ where: { email: userEmail } });

    console.log('user.id', id);
    await Survey.createNewSurvey({ userId: id, title: req.body.title });

    //   const { email, password } = req.body;
    //   const user = await User.scope('withPassword').findOne({ where: { email } });

    //   if (!user || !(await user.comparePasswords(password))) {
    //     return res
    //       .status(401)
    //       .send({ success: false, message: 'Invalid credentials' });
    //   }

    //   const payload = { email };
    //   const accessToken = JWTUtils.generateAccessToken(payload);

    return res.status(200).send({
      success: true,
      // message: 'Successfully logged in',
      // data: {
      //   accessToken,
      // },
    });
  })
);

export default router;
