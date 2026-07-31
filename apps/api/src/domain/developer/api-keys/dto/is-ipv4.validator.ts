import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

export function isIpv4Address(value: string): boolean {
  return IPV4_PATTERN.test(value.trim());
}

export function IsIpv4AddressArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIpv4AddressArray',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null) return true;
          if (!Array.isArray(value)) return false;
          return value.every(
            (item) => typeof item === 'string' && isIpv4Address(item),
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain valid IPv4 addresses`;
        },
      },
    });
  };
}
