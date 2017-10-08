import { Controller, Post, Get, All, Body, Param, Request, UseGuards, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import * as express from 'express';

import { NotFoundException } from '../common/exceptions/notFound.exception';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { IrefershTokenRedis } from './auth.service';

@Controller('auth')
@UseGuards(RolesGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // refresh token
  @Post('/token')
  public async getToken( @Body() body: AuthDto ): Promise<{ accessToken: string }> {
    return {
      accessToken: await this.authService.refreshAccessToken(body),
    };
  }

  // revoke token
  @Roles('admin')
  @Post('/token/revoke')
  public revokeToken( @Body() body: AuthDto ): void {
    this.authService.revokeRefreshToken(body);
  }

  // get all tokens
  @Roles('admin')
  @Get('/token/all/:id')
  public async getAllTokens( @Param() params: { id: string }): Promise<IrefershTokenRedis[]> {
    return this.authService.getAllTokens(Number.parseInt(params.id));
  }

  @All('*')
  public all( @Request() req) {
    throw new NotFoundException(req.route.path);
  }
}