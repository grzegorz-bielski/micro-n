import { HttpException } from '@nestjs/core';
import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class ValidationException extends HttpException {
  constructor(errors: ValidationError[]) {
    super({
      message: 'Request validation failed.',
      reasons: errors,
    }, HttpStatus.BAD_REQUEST);
  }
}