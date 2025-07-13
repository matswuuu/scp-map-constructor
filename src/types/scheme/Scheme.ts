import type {Pos} from "../../utils/pos.ts";

export interface Anchor {
    pos: Pos
}

export class Scheme {

    id: string;
    type: string;
    pivot: Pos;
    // pos1: Pos;
    // pos2: Pos;
    color: string = "white";
    _anchors: Anchor[];
    occupiedBlocks: Pos[]; // List of block coordinates, relative to pivot
    allowIntersection: boolean;

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
