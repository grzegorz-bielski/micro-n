import {
    Validator,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isBase64Data', async: false })
export class IsBase64Data implements ValidatorConstraintInterface {
    validate(text: string, args: ValidationArguments) {
        return (new Validator()).isBase64(/,(.+)/.exec(text)[1]);
    }

    defaultMessage(args: ValidationArguments) {
        return 'Text ($value) must be base64 encoded';
    }

}