import express, { NextFunction } from 'express';
import { getConnection } from 'typeorm';

import { MessageResponse, RequestType, ResponseType } from '../types';

const router = express.Router();

router.get('/:id', async (
  req: RequestType<{ id: string }, {}, {}>,
  res: ResponseType<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const data = await getConnection().query(`
      select "id", "content", "url", (date_part('epoch', "expiresAt") * 1000) as "expiresAt",
      ("expiresAt" < now()) as "expired", "type" from message where "url" = $1
    `, [id]) as MessageResponse[];
    if (data.length > 0) {
      if (data[0].expired) {
        return next(new Error('Link Expired'));
      }
      return res.json({
        status: 'SUCCESS',
        data: data[0],
      });
    }
    return next(new Error('Not Found'));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return next(new Error('Internal Server Error'));
  }
});

export default router;
