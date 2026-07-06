import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isHttpsUrl', async: false })
export class IsHttpsUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value !== 'string') return false;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname.length > 0;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid HTTPS URL`;
  }
}

export function IsHttpsUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsHttpsUrlConstraint,
    });
  };
}
