import type {Rotation} from "../utils/Rotation.ts";

export interface Block {
    x: number;
    y: number;
    z: number;
}

export interface BlockStructure {
    id: string;
    pivotPoint: Block;
    pos1: Block;
    pos2: Block;
    color: string;
    anchors: [Block];
    occupiedBlocks: Array<Block>; // List of block coordinates, relative to pivotPoint
}

export interface PlacedBlock extends Block {
    id: string;
    rotation: Rotation;
}
