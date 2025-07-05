import 'reflect-metadata';

export const METADATA_KEY = 'custom:metadata';

export function metadata(): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
        const existingKeys: (string | symbol)[] =
            Reflect.getMetadata(METADATA_KEY, target) || [];

        existingKeys.push(propertyKey);
        Reflect.defineMetadata(METADATA_KEY, existingKeys, target);
    }
}