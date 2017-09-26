import { HttpException } from '@nestjs/core';
import { HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor(path: string) {
    super(`Not Found ${path}`, HttpStatus.NOT_FOUND);
  }
}