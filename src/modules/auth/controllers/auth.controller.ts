import { Controller, Post, Get, Delete, All, Body, Param, Request, UseGuards, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import * as express from 'express';

import { NotFoundException } from '../../common/exceptions/notFound.exception';
import { AuthService } from './../services/auth.service';
import { AuthDto } from './../dto/auth.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IrefershTokenRedis } from './../services/auth.service';

@Controller('auth')
@UseGuards(RolesGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // refresh token
  @Get('/token/:id')
  public async getToken( @Param() params: { id: string }, @Request() req ) {
    const accessToken = await this.authService.refreshAccessToken({
      refreshToken: req.header('x-refresh'),
      id: Number.parseInt(params.id),
    });

    return {
      data: 'Ok',
      meta: {
        accessToken,
      },
    };
  }

  // revoke token
  @Roles('admin')
  @Delete('/token/revoke')
  public revokeToken( @Body() body: AuthDto ): void {
    this.authService.revokeRefreshToken(body);
  }

  // get all tokens
  @Roles('admin')
  @Get('/token/all/:id')
  public async getAllTokens( @Param() params: { id: string }) {
    return {
      data: await this.authService.getAllRefreshTokens(Number.parseInt(params.id)),
    };
  }

  @All('*')
  public all( @Request() req) {
    throw new NotFoundException(req.route.path);
  }
}