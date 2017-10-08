import { Controller, Request, Get, Post, Delete, Body, All, UseGuards, Response, HttpStatus, ReflectMetadata, Query, UseInterceptors } from '@nestjs/common';
import * as express from 'express';
import * as jwt from 'jsonwebtoken';

import { SignUpUserDto } from './dto/SignUpUser.dto';
import { VerificationQueryDto } from './dto/VerificationQuery.dto';
import { UserEntity } from './user.entity';

import { UsersService } from './services/users.service';
import { AuthService, IcreateToken } from '../auth/auth.service';
import { VerificationService } from './services/verification.service';
import { AvailabilityService } from './services/availability.service';

import { RolesGuard } from '../common/guards/roles.guard';
import { ForbiddenException } from '../common/exceptions/forbidden.exception';
import { NotFoundException } from '../common/exceptions/notFound.exception';
import { Roles } from '../common/decorators/roles.decorator';
import { TimestampInterceptor } from '../common/interceptors/timestamp.interceptor';
import { SanitizationInterceptor } from './interceptors/sanitization.interceptor';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly availabilityService: AvailabilityService,
    private readonly verificationService: VerificationService,
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

  @Get('/verify')
  public async verifyUser(
    @Query() query: VerificationQueryDto,
  ) {
    // verify user
    const id = await this.verificationService.verify(query.hash);
    // update user status
    await this.usersService.updateStatus(id, true);
    // delete hash
    this.verificationService.deleteHash(query.hash);

    // todo:
    // render nice verification msg
    return 'verified';
  }

  @Post('/signup')
  @UseInterceptors(SanitizationInterceptor)
  public async signUp(@Body() user: SignUpUserDto, @Request() request: express.Request): Promise<object> {

    // check if given credentials are available
    await this.availabilityService.test(user, [
      { property: 'name', value: user.name },
      { property: 'email', value: user.email },
    ]);

    // create user & tokens
    const newUser: UserEntity = await this.usersService.signUp(user);
    const tokenData: IcreateToken = { roles: newUser.roles, id: newUser.id };
    const tokens: string[] = await Promise.all([
      this.authService.createAccessToken(tokenData),
      this.authService.createRefreshToken(tokenData),
    ]);

    // send verification email
    this.verificationService.sendVerificationEmail({
      id: newUser.id.toString(),
      email: newUser.email,
      host: request.get('host'),
      protocol: request.protocol,
    });

    // send user & tokens to sanitization interceptor
    return {
      accessToken: tokens[0],
      refreshToken: tokens[1],
      user: newUser,
    };
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