import { NextFunction } from 'express';
import { RequestType, ResponseType } from '../types';

const isAuthenticated = (
  req: RequestType<any, any, any>,
  res: ResponseType<string>,
  next: NextFunction,
) => {
  if (req.session.userId) {
    return next();
  }
  return res.json({
    status: 'FAILED',
    data: 'Please Login to continue',
  });
};

export default isAuthenticated;
