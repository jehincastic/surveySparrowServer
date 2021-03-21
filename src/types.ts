import { Request, Response } from 'express';
import { Session } from 'express-session';

export type LoginInput = {
  email: string;
  password: string;
};

export type MessageInput = {
  content: string;
  type: 'MESSAGE' | 'LINK';
  expiresAt: number;
};

export interface RegisterInput extends LoginInput {
  name: string
}

export type CommonResponse<T> = {
  status: 'SUCCESS' | 'FAILED';
  data: T;
};

export type UserResponse = {
  id: number;
  email: string;
  name: string;
}

export interface SessionType extends Session {
  userId: number;
}

export type RequestType<P, B, Q> = Request<P, {}, B, Q> & {
  session: Session & {
    userId?: number;
  }
};

export type MessageResponse = {
  id: number;
  content: string;
  url: string;
  expiresAt: number;
  expired: boolean;
  type: 'MESSAGE' | 'LINK';
};

export type AllMsgType = {
  count: number;
  messages: MessageResponse[];
};

export type ResponseType<T> = Response<CommonResponse<T>>;
