import { ExceptionFilter, Catch } from '@nestjs/common';
import { HttpException } from '@nestjs/core';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, response) {
    const excStatus = exception.getStatus();
    const excResponse = exception.getResponse();

    response.status(excStatus).json({
      statusCode: excStatus,
      message: 'HttpException',
      details: excResponse,
    });
  }
}