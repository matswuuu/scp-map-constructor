import type {Pos} from "../../utils/pos.ts";

export class Scheme {

    schemeId: string;
    pivot: Pos;
    pos1: Pos;
    pos2: Pos;
    color: string;
    anchors: Pos[];
    occupiedBlocks: Pos[]; // List of block coordinates, relative to pivot

    constructor(schemeId: string,
                pivot: Pos,
                pos1: Pos,
                pos2: Pos,
                color: string,
                anchors: Pos[],
                occupiedBlocks: Pos[]) {
        this.schemeId = schemeId;
        this.pivot = pivot;
        this.pos1 = pos1;
        this.pos2 = pos2;
        this.color = color;
        this.anchors = anchors;
        this.occupiedBlocks = occupiedBlocks;
    }

}
