import { ExceptionFilter, Catch, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, response) {
    const excStatus = exception.getStatus();
    const excResponse = exception.getResponse();

    response.status(excStatus).json({
      statusCode: excStatus,
      type: 'HttpException',
      details: excResponse,
    });
  }
}