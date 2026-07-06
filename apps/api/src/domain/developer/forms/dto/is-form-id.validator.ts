import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isValidFormId } from '../../../../core/common/utils/secure-id.util';

@ValidatorConstraint({ name: 'isFormId', async: false })
export class IsFormIdConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (typeof value !== 'string') return false;
    return isValidFormId(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid form ID`;
  }
}

export function IsFormId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFormIdConstraint,
    });
  };
}
