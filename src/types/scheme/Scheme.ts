import type {Pos} from "../../utils/pos.ts";

export interface Anchor {
    pos: Pos
}

export class Scheme {

    id: string;
    type: string;
    pivot: Pos;
    pos1: Pos;
    pos2: Pos;
    color: string = "white";
    _anchors: Anchor[];
    occupiedBlocks: Pos[]; // List of block coordinates, relative to pivot

    constructor(id: string,
                type: string,
                pivot: Pos,
                pos1: Pos,
                pos2: Pos,
                color: string,
                anchors: Anchor[],
                occupiedBlocks: Pos[]) {
        this.id = id;
        this.type = type;
        this.pivot = pivot;
        this.pos1 = pos1;
        this.pos2 = pos2;
        this.color = color;
        this._anchors = anchors;
        this.occupiedBlocks = occupiedBlocks;
    }

    get anchors(): Pos[] {
        return this._anchors.map(anchor => ({
            x: anchor.pos.x - this.pivot.x,
            y: anchor.pos.y - this.pivot.y,
            z: anchor.pos.z - this.pivot.z
        }));
    }

    set anchors(value: Anchor[]) {
        this._anchors = value;
    }

}
