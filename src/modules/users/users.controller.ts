import { Controller, Get, Post, Body, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { User } from './interfaces/user.interface';
import { ForbiddenException } from '../common/exceptions/forbidden.exception';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TimestampInterceptor } from '../common/interceptors/timestamp.interceptor';

@Controller('users')
@UseFilters(new HttpExceptionFilter())
@UseGuards(RolesGuard)
@UseInterceptors(TimestampInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  // @Roles('admin')
  async getAll(): Promise<User[]> {
    return this.usersService.getAll();
  }

  @Get('forbidden')
  async forbidden(): Promise<void> {
    throw new ForbiddenException();
  }

  @Post()
  async newUser(@Body() createUserDto: CreateUserDto): Promise<void> {
    this.usersService.create(createUserDto);
  }

}