import express, { NextFunction } from 'express';
import { getConnection } from 'typeorm';
import { nanoid } from 'nanoid';
import { body, Meta, validationResult } from 'express-validator';

import isAuthenticated from '../middlewaes/isAuth';
import {
  AllMsgType,
  MessageInput,
  MessageResponse,
  RequestType,
  ResponseType,
} from '../types';
import handleValidationErrors from '../utils';

const router = express.Router();

router.use(isAuthenticated);

router.post('/create',
  body('content')
    .notEmpty()
    .withMessage('URL cannot Be Empty.')
    .if((_: any, { req }: Meta) => req.body.type === 'LINK')
    .isURL()
    .withMessage('Invalid Url String.'),
  body('expiresAt')
    .notEmpty()
    .withMessage('Expires At Cannot Be Empty.')
    .isNumeric()
    .withMessage('Invalid Expires At'),
  async (
    req: RequestType<{}, MessageInput, {}>,
    res: ResponseType<any>,
    next: NextFunction,
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return handleValidationErrors(next, errors.array());
      }
      const {
        content,
        type,
        expiresAt,
      } = req.body;
      const { userId } = req.session;
      const url = nanoid(7);
      const data = await getConnection().query(`
        insert into message ("content", "url", "expiresAt", "creatorId", "type")
        values ($1, $2, now() + '${expiresAt} minutes'::interval, $3, $4)
        returning "id", "content", "url", (date_part('epoch', "expiresAt") * 1000) as "expiresAt",
        ("expiresAt" < now()) as "expired", "type"
      `, [content, url, userId, type]) as MessageResponse[];
      return res.json({
        status: 'SUCCESS',
        data: data[0],
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return next(new Error('Internal Server Error'));
    }
  });

router.get('/:page', async (
  req: RequestType<{page: number}, {}, {}>,
  res: ResponseType<AllMsgType>,
  next: NextFunction,
) => {
  try {
    const { page } = req.params;
    const { userId } = req.session;
    const promArr: Promise<{count: number}[] | MessageResponse[]>[] = [];
    promArr.push(getConnection().query(`
      select "id", "content", "url", (date_part('epoch', "expiresAt") * 1000) as "expiresAt",
      ("expiresAt" < now()) as "expired", "type" from message where "creatorId" = $1
      order by "id" desc offset $2 limit 5
    `, [userId, (page - 1) * 5]));
    promArr.push(getConnection().query('select count(*) as count from message where "creatorId" = $1', [userId]));
    const promiseData = await Promise.all(promArr);
    const data = promiseData[0] as MessageResponse[];
    const count = promiseData[1] as {count: number}[];
    return res.json({
      status: 'SUCCESS',
      data: {
        count: count[0].count,
        messages: data,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return next(new Error('Internal Server Error'));
  }
});

export default router;
