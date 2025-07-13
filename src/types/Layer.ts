import type {Structure} from "./Structure.ts";

export interface Layer {
    value: string;
    name: string;
    structures: Structure[];
}
