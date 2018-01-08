import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  AfterInsert,
} from 'typeorm';

export class MsgMetadataPartial {
  @Column({ type: 'int', default: 0 })
  public score: number;

  @CreateDateColumn()
  public createdAt: string;

  @UpdateDateColumn()
  public updatedAt: string;

  // event listeners

  @AfterInsert()
  public addDefault() {
    if (!this.score) {
      this.score = 0;
    }
  }
}