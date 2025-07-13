import {Scheme} from "./Scheme.ts";
import {DoorScheme} from "./DoorScheme.ts";

type Constructor<T = object> = new (...args: any[]) => T;

const prototypes = new Map<string, Constructor>();
prototypes.set("default", Scheme);
prototypes.set("door", DoorScheme);

export function deserializeScheme(id: string, data: any): Scheme {
    const constructor = prototypes.get(data.type) ?? Scheme;
    if (!constructor) {
        throw new Error(`No constructor for type "${data.type}"`);
    }

    const obj = Object.create(constructor.prototype) as Scheme;
    Object.assign(obj, data);
    obj["id"] = id;

    return obj;
}
