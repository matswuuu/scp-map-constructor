import type {Pos} from "../utils/pos.ts";

export interface Anchor {
    pos: Pos
}

export class Scheme {

    id!: string;
    type!: string;
    pivot!: Pos;
    // pos1: Pos;
    // pos2: Pos;
    color: string = "white";
    _anchors!: Anchor[];
    occupiedBlocks!: Pos[]; // List of block coordinates, relative to pivot
    allowIntersection!: boolean;
    metadata: Map<string, any> = new Map();

    constructor(id: string,
                type: string,
                pivot: Pos,
                color: string,
                anchors: Anchor[],
                occupiedBlocks: Pos[],
                allowIntersection: boolean,
                metadataFields: Map<string, any>) {
        this.id = id;
        this.type = type;
        this.pivot = pivot;
        this.color = color;
        this._anchors = anchors;
        this.occupiedBlocks = occupiedBlocks;
        this.allowIntersection = allowIntersection;
        this.metadata = metadataFields;
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
