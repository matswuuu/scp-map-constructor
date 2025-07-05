import { METADATA_KEY } from '../decorators/metadata.decorator';

export function getAnnotatedFields(instance: object): Map<string, object> {
    const fields = Reflect.getMetadata(METADATA_KEY, instance) || [];
    const fieldMap = new Map<string, object>();
    for (const field of fields) {
        fieldMap.set(field, (instance as never)[field]);
    }
    return fieldMap;
}
