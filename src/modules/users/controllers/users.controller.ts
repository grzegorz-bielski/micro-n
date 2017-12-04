import {
  Controller,
  Request,
  Get,
  Post,
  Delete,
  Body,
  All,
  Headers,
  HttpCode,
  UseGuards,
  Response,
  HttpStatus,
  ReflectMetadata,
  Query,
  Param,
  UseInterceptors,
  HttpException,
} from '@nestjs/common';

import { SignUpUserDto } from '../dto/sign-up.dto';
import { VerificationQueryDto } from '../dto/verification-query.dto';
import { LogInCredentialsDto } from '../dto/log-in-credentials.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

import { UserEntity } from '../entities/user.entity';
import { UsersService } from '../services/users.service';
import { AuthService, IaccessTokenData } from '../../auth/services/auth.service';
import { VerificationService } from '../services/verification.service';
import { AvailabilityService } from '../services/availability.service';

import { RolesGuard } from '../../common/guards/roles.guard';
import { ForbiddenException } from '../../common/exceptions/forbidden.exception';
import { NotFoundException } from '../../common/exceptions/notFound.exception';
import { Roles } from '../../common/decorators/roles.decorator';
import { SanitizationInterceptor } from '../interceptors/sanitization.interceptor';

export interface IResponseUser {
  accessToken: string;
  refreshToken: string;
  user: UserEntity;
}

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly availabilityService: AvailabilityService,
    private readonly verificationService: VerificationService,
  ) {}

  @Post('/signup')
  public async signUp(@Body() user: SignUpUserDto, @Request() request): Promise<void | { hash: string }> {
    // check if given credentials are available
    await this.availabilityService.test(user, [
      { property: 'name', value: user.name },
      { property: 'email', value: user.email },
    ]);

    // create user
    const newUser: UserEntity = await this.usersService.signUp(user);

    // send verification email
    const { hash } = await this.verificationService.sendVerificationEmail({
      id: newUser.id.toString(),
      email: newUser.email,
    });

    // return hash in test env
    if (process.env.NODE_ENV === 'test') {
      return { hash };
    }
  }

  @Post('/login')
  @HttpCode(200)
  @UseInterceptors(SanitizationInterceptor)
  public async logIn(@Body() credentials: LogInCredentialsDto) {
    // get user
    const user: UserEntity = await this.usersService.logIn(credentials);

    // get new tokens
    const tokenData: IaccessTokenData = { roles: user.roles, id: user.id };
    const tokens: string[] = await Promise.all([
      this.authService.createAccessToken(tokenData),
      this.authService.createRefreshToken(tokenData),
    ]);

    // send user & tokens to sanitization interceptor
    return {
      data: {
        user,
      },
      meta: {
        accessToken: tokens[0],
        refreshToken: tokens[1],
      },
    };
  }

  @Delete('/logout')
  @Roles('user')
  public logOut(@Request() request, @Headers() headers): Promise<void> {
    // remove current refresh token from Redis
    return this.authService.revokeRefreshToken({
      id: request.user.id,
      refreshToken: headers['x-refresh'],
    });
  }

  @Delete('/logoutall')
  @Roles('user')
  public logOutAll(@Request() request): Promise<void> {
    // remove all tokens from Redis
    return this.authService.revokeAllRefreshTokens(request.user.id);
  }

  @Get('/verify')
  public async verifyUser(@Query() query: VerificationQueryDto) {
    // verify user
    const id: string = await this.verificationService.verify(query.hash);
    // update user status & delete hash
    await Promise.all([
      this.usersService.updateUser(id, { isActive: true }),
      this.verificationService.deleteHash(query.hash),
    ]);
  }

  @Get('/:id/resetpassword')
  public async resetPasswordRequest(@Param() params: { id: string }): Promise<void> {
    const user = await this.usersService.getUser(params.id);
    if (!user) {
      throw new HttpException('There is no such user', HttpStatus.NOT_FOUND);
    }
    await this.verificationService.sendResetPasswordRequest({ id: user.id, email: user.email });
  }

  @HttpCode(200)
  @Post('/resetpassword')
  public async resetPassword(@Body() body: ResetPasswordDto): Promise<void> {
    // check if hash is in Redis
    const id: string = await this.verificationService.verify(body.hash);
    // set new password & delete hash
    await Promise.all([
      this.usersService.updateUser(id, { password: body.newPassword }),
      this.verificationService.deleteHash(body.hash),
    ]);
  }

  @All('*')
  public all( @Request() req) {
    throw new NotFoundException(req.route.path);
  }
}