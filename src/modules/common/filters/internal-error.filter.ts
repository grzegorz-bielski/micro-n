import { ExceptionFilter, Catch, HttpException } from '@nestjs/common';

@Catch()
export class InternalErrorFilter implements ExceptionFilter {
  private readonly statusCode: number = 500;
  private readonly logToConsole: boolean = false;

  catch(exception: Error, response) {
    if (exception instanceof HttpException) {
      return;
    }
    if (this.logToConsole) {
      console.log(exception);
    }

    response.status(this.statusCode).json({
      statusCode: this.statusCode,
      type: 'InternalError',
      details: `${exception.name}: ${exception.message}`,
    });
  }
}