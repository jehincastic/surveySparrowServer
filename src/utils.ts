import { NextFunction } from 'express';
import { ValidationError } from 'express-validator';

const handleValidationErrors = (
  next: NextFunction,
  errors: ValidationError[],
) => next(new Error(errors[0].msg));

export default handleValidationErrors;
