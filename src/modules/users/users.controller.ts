import { Controller, Request, Get, Post, Delete, Body, All, UseGuards, Response, HttpStatus, ReflectMetadata } from '@nestjs/common';
import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import { SignUpUserDto } from './dto/SignUpUser.dto';
import { UsersService } from './services/users.service';
import { AuthService } from '../auth/auth.service';
import { User } from './interfaces/user.interface';
import { UserEntity } from './user.entity';
import { ForbiddenException } from '../common/exceptions/forbidden.exception';
import { NotFoundException } from '../common/exceptions/notFound.exception';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TimestampInterceptor } from '../common/interceptors/timestamp.interceptor';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @Roles('admin')
  async getAll(): Promise<UserEntity[]> {
    return this.usersService.getAll();
  }

  // @Get('forbidden')
  // async forbidden(): Promise<void> {
  //   throw new ForbiddenException();
  // }

  @Get('/me')
  // @UseGuards()
  @Roles('user')
  // @ReflectMetadata('test', 'test stuff')
  getMe() {
    return 'me';
  }

  @Post('/signup')
  async signUp(@Body() user: SignUpUserDto, @Response() response: express.Response): Promise<void> {
    const newUser: UserEntity = await this.usersService.signUp(user);
    const token: string = await this.authService.createAccessToken({ roles: newUser.roles, id: newUser.id });

    const sanitizedUser = Object.assign({}, newUser);
    delete sanitizedUser.password;
    delete sanitizedUser.roles;

    response
      .header('x-auth', token)
      .status(HttpStatus.CREATED)
      .send(sanitizedUser);
  }

  @Delete('/logout')
  async logOut(): Promise<string> {
    return 'logout';
  }

  @All('*')
  all( @Request() req) {
    throw new NotFoundException(req.route.path);
  }
}