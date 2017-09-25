import { Component } from '@nestjs/common';
import { User } from './interfaces/user.interface';

@Component()
export class UsersService {
  private readonly users: User[] = [];

  getAll(): User[] {
    return this.users;
  }

  create(user: User) {
    this.users.push(user);
  }
}