import { HttpStatus, HttpException } from '@nestjs/common';
import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken';

export class UnauthorizedException extends HttpException {
  constructor(error: JsonWebTokenError | NotBeforeError | TokenExpiredError) {
    super({
      message: 'Unauthorized',
      reasons: [error.message],
    }, HttpStatus.UNAUTHORIZED);
  }
}
