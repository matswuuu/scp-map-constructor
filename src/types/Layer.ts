import type {PlacedBlock} from "./Block.ts";

export interface Layer {
    value: string;
    name: string;
    placedBlocks: PlacedBlock[];
}
