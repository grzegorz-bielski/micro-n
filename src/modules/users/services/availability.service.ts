import { Component, Inject } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Repository } from 'typeorm';
import { UserEntity } from './../user.entity';
import { UserRepositoryToken } from '../../constants';
import { ValidationException } from '../../common/exceptions/validation.exception';

export interface ValidationField {
  property: string;
  value: string;
}

@Component()
export class AvailabilityService {
  constructor(
    @Inject(UserRepositoryToken)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  public async test(target: object, fields: ValidationField[]): Promise<void> {
    // ask DB if user with these fields already exists
    const availability = await this.checkAvailability(fields);

    // throw error if any of provided fields is not available
    if (availability.some(value => !!value)) {
      // verbose error description made for sake of consistency (with DTO validation from class-validator)
      const errors: ValidationError[] = this.constructErrors(target, fields, availability);
      throw new ValidationException(errors);
    }
  }

  private checkAvailability(fields: ValidationField[]) {
    return Promise.all(
      fields.map(
        field => this.userRepository.findOne({ [field.property]: field.value }).then(user => !!user),
      ),
    );
  }

  private constructErrors(target: object, fields: ValidationField[], availability: boolean[]) {
    const errors = [];
    availability.forEach((notAvailable, index) => {
       if (notAvailable) {
         errors.push({
           target,
           property: fields[index].property,
           value: fields[index].value,
           constraints: { isTaken: `This ${fields[index].property} is already taken` },
           children: [],
          });
       }
     });
    return errors;
  }
}
