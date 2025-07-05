import type {Structure} from "../utils/pos.ts";

export interface Layer {
    value: string;
    name: string;
    placedBlocks: Structure[];
}
