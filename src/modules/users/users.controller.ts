import { Controller, Request, Get, Post, Delete, Body, All, UseGuards } from '@nestjs/common';
import { SignUpUserDto } from './dto/SignUpUser.dto';
import { UsersService } from './users.service';
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
  constructor(private readonly usersService: UsersService) {}

  @Get()
  // @Roles('admin')
  async getAll(): Promise<UserEntity[]> {
    return this.usersService.getAll();
  }

  // @Get('forbidden')
  // async forbidden(): Promise<void> {
  //   throw new ForbiddenException();
  // }

  @Post('/signup')
  async signUp(@Body() user: SignUpUserDto): Promise<UserEntity> {
    return this.usersService.signUp(user);
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