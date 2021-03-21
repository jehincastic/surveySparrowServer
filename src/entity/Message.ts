import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './User';

@Entity()
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  content!: string;

  @Column({ length: 120, unique: true })
  url!: string;

  @Column({ length: 120 })
  type!: 'MESSAGE' | 'LINK';

  @Column({ precision: 3 })
  expiresAt!: Date;

  @Column()
  creatorId: number;

  @ManyToOne(() => User, (user) => user.messages)
  creator: User;

  @CreateDateColumn({ precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ precision: 3 })
  updatedAt: Date;
}
