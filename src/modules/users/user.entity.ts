import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true, length: 100 })
  public name: string;

  @Column({ unique: true, length: 100 })
  public email: string;

  @Column({ length: 100 })
  public password: string;

  @Column({ length: 500 })
  public description: string;

  @BeforeInsert()
  public async encrypt() {
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(this.password, salt);
      this.password = hash;
    } catch (error) {
      console.log(error);
    }
  }
}
