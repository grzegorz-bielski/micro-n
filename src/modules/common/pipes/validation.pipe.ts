import { PipeTransform, Pipe, ArgumentMetadata, HttpStatus, HttpException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationException } from '../exceptions/validation.exception';

@Pipe()
export class ValidationPipe implements PipeTransform<any> {

   // @value -> currently procesed parameter, np req.body
   // @metadata -> metadata of parameter: { type, metatype, data}
   public async transform(value, metadata: ArgumentMetadata) {

    const { metatype } = metadata;

    // if there is no metatype or it's not native JS type then do nothing
    if (!metatype || !this.isNativeJsType(metatype)) {
      return value;
    }

    const objectOfMetaType = plainToClass(metatype, value);
    const errors = await validate(objectOfMetaType);

    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    return value;
  }

  private isNativeJsType(metatype): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.find((type) => metatype === type);
  }

}
