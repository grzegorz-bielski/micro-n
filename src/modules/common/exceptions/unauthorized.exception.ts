import { HttpException } from '@nestjs/core';
import { HttpStatus } from '@nestjs/common';

export class UnauthorizedException extends HttpException {
  constructor(error) {
    super({
      message: 'Unauthorized',
      reason: error.message,
    }, HttpStatus.UNAUTHORIZED);
  }
}