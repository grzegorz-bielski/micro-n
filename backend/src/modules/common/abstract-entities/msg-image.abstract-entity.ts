import {
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class MsgImageAbstract {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ nullable: true })
  public fileName: string;

  @Column({ nullable: true })
  public directLink: string;

  // meta

  @Column({ default: false })
  public isNsfw: boolean;

  @CreateDateColumn()
  public createdAt: string;

  @UpdateDateColumn()
  public updatedAt: string;
}