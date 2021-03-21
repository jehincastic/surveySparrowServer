/* eslint-disable import/first */
import dotenv from 'dotenv';

dotenv.config();

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import { createConnection } from 'typeorm';
import helmet from 'helmet';
import path from 'path';

import {
  COOKIE_NAME,
  COOKIE_SECRET,
  COOKIE_AGE,
  PORT,
} from './constants';
import { CommonResponse } from './types';
import indexRoutes from './routes/index';
import messagesRoute from './routes/messages';
import viewRoutes from './routes/View';

const main = async () => {
  const publicPath = path.resolve(__dirname, '..', 'public');
  const conn = await createConnection();
  conn.runMigrations();
  const app = express();
  app.use(helmet());
  app.use(express.static(publicPath));
  app.use(express.json());
  app.use(cors());

  app.use(session({
    name: COOKIE_NAME,
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: COOKIE_AGE,
      httpOnly: true,
    },
  }));

  app.use('/api', indexRoutes);
  app.use('/api/message', messagesRoute);
  app.use('/api/view', viewRoutes);
  app.get('*', (_, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err: Error, _: Request, res: Response<CommonResponse<string>>, __: NextFunction) => {
    res.json({
      status: 'FAILED',
      data: err.message,
    });
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server Started on Port ${PORT} 🚀`);
  });
};

// eslint-disable-next-line no-console
main().catch(console.error);
