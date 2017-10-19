import {
  Controller,
  Request,
  Get,
  Post,
  Delete,
  Body,
  All,
  Headers,
  UseGuards,
  Response,
  HttpStatus,
  ReflectMetadata,
  Query,
  UseInterceptors,
} from '@nestjs/common';

import { SignUpUserDto } from '../dto/SignUpUser.dto';
import { VerificationQueryDto } from '../dto/VerificationQuery.dto';
import { LogInCredentialsDto } from '../dto/LogInCredentials.dto';
import { UserEntity } from '../entities/user.entity';

import { UsersService } from '../services/users.service';
import { AuthService, IaccessTokenData } from '../../auth/services/auth.service';
import { VerificationService } from '../services/verification.service';
import { AvailabilityService } from '../services/availability.service';

import { RolesGuard } from '../../common/guards/roles.guard';
import { ForbiddenException } from '../../common/exceptions/forbidden.exception';
import { NotFoundException } from '../../common/exceptions/notFound.exception';
import { Roles } from '../../common/decorators/roles.decorator';
import { TimestampInterceptor } from '../../common/interceptors/timestamp.interceptor';
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

  // @Get()
  // @Roles('admin')
  // async getAll(): Promise<UserEntity[]> {
  //   return this.usersService.getAll();
  // }

  @Post('/signup')
  public async signUp(@Body() user: SignUpUserDto, @Request() request): Promise<void> {
    // check if given credentials are available
    await this.availabilityService.test(user, [
      { property: 'name', value: user.name },
      { property: 'email', value: user.email },
    ]);

    // create user
    const newUser: UserEntity = await this.usersService.signUp(user);

    // send verification email
    await this.verificationService.sendVerificationEmail({
      id: newUser.id.toString(),
      email: newUser.email,
      host: request.get('host'),
      protocol: request.protocol,
    });
  }

  @Get('/verify')
  public async verifyUser( @Query() query: VerificationQueryDto ): Promise<string> {
    // verify user
    const id: string = await this.verificationService.verify(query.hash);
    // update user status & delete hash
    await Promise.all([
      this.usersService.updateStatus(id, true),
      this.verificationService.deleteHash(query.hash),
    ]);
    // TODO: render nice verification msg
    return 'verified';
  }

  @Post('/login')
  @UseInterceptors(SanitizationInterceptor)
  public async logIn(@Body() credentials: LogInCredentialsDto): Promise<IResponseUser> {
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
      accessToken: tokens[0],
      refreshToken: tokens[1],
      user,
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

  @All('*')
  all( @Request() req) {
    throw new NotFoundException(req.route.path);
  }
}