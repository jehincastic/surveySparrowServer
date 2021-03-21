import express, { NextFunction } from 'express';
import argon2 from 'argon2';
import { body, validationResult } from 'express-validator';

import {
  LoginInput,
  RegisterInput,
  RequestType,
  ResponseType,
  UserResponse,
} from '../types';
import { User } from '../entity/User';
import handleValidationErrors from '../utils';
import { COOKIE_NAME } from '../constants';

const router = express.Router();

router.get('/me',
  async (
    req: RequestType<{}, LoginInput, {}>,
    res: ResponseType<UserResponse | string>,
    next: NextFunction,
  ) => {
    if (req.session.userId) {
      const user = await User.findOne({
        id: req.session.userId,
      });
      if (user) {
        return res.json({
          status: 'SUCCESS',
          data: {
            email: user.email,
            name: user.name,
            id: user.id,
          },
        });
      }
    }
    return next(new Error('Please Login In'));
  });

router.post('/logout',
  async (
    req: RequestType<{}, LoginInput, {}>,
    res: ResponseType<string>,
  ) => {
    req.session.destroy((err: any) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
      res.clearCookie(COOKIE_NAME);
      res.json({
        status: 'SUCCESS',
        data: 'Logged Out Succefully',
      });
    });
  });

router.post('/login',
  body('email').isEmail().normalizeEmail().withMessage('Check the Email Address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be atleast 6 chars.').escape(),
  async (
    req: RequestType<{}, LoginInput, {}>,
    res: ResponseType<UserResponse>,
    next: NextFunction,
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return handleValidationErrors(next, errors.array());
      }
      const { email, password } = req.body;
      const user = await User.findOne({
        email,
      });
      if (user) {
        const isPasswordValid = await argon2.verify(user.password, password);
        if (isPasswordValid) {
          req.session.userId = user.id;
          return res.json({
            status: 'SUCCESS',
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          });
        }
      }
      return next(new Error('Invalid Email/Password.'));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return next(new Error('Server Error'));
    }
  });

router.post('/register',
  body('email').isEmail().normalizeEmail().withMessage('Check the Email Address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be atleast 6 chars.').escape(),
  body('name').isLength({ min: 3 }).withMessage('Name must be atleast 3 chars.').escape(),
  async (
    req: RequestType<{}, RegisterInput, {}>,
    res: ResponseType<UserResponse>,
    next: NextFunction,
  ) => {
    try {
      const {
        email,
        password,
        name,
      } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return handleValidationErrors(next, errors.array());
      }
      const hashedPassword = await argon2.hash(password);
      const newUser = {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      };
      const user = await User.create({
        ...newUser,
      }).save();
      req.session.userId = user.id;
      return res.json({
        status: 'SUCCESS',
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err) {
      if (err.code === '23505') {
        return next(new Error('Email Already taken.'));
      }
      // eslint-disable-next-line no-console
      console.error(err);
      return next(new Error('Server Error'));
    }
  });

export default router;
