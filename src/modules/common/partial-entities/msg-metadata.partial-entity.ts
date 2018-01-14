import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  AfterInsert,
} from 'typeorm';

export class MsgMetadataPartial {
  @CreateDateColumn()
  public createdAt: string;

  @UpdateDateColumn()
  public updatedAt: string;

}