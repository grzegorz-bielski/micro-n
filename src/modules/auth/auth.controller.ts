import { Controller, Get, All } from '@nestjs/common';
import * as express from 'express';
import { NotFoundException } from '../common/exceptions/notFound.exception';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Get('/token')
  getToken() {
    // return this.authService.verify();
  }
}